create or replace function public.close_operational_period(
  p_operational_period_id uuid,
  p_expected_version integer,
  p_closure_note text,
  p_incidents_reviewed boolean,
  p_actions_reviewed boolean,
  p_log_reviewed boolean,
  p_perimeter_reviewed boolean,
  p_idempotency_key uuid
)
returns table (operational_period_id uuid, version integer, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_period public.operational_periods%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_note text := nullif(btrim(p_closure_note), '');
  v_fingerprint jsonb;
begin
  if v_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_operational_period_id is null or p_expected_version is null or p_idempotency_key is null or v_note is null then raise exception 'Period, version, closure note, and idempotency key are required' using errcode = '22023'; end if;
  if char_length(v_note) > 1000 then raise exception 'Closure note exceeds the 1000 character limit' using errcode = '22001'; end if;
  if not coalesce(p_incidents_reviewed, false) or not coalesce(p_actions_reviewed, false) or not coalesce(p_log_reviewed, false) or not coalesce(p_perimeter_reviewed, false) then raise exception 'All closure checks must be confirmed' using errcode = '22023'; end if;
  select * into v_period from public.operational_periods where id = p_operational_period_id for update;
  if not found or not app_private.has_event_capability(v_period.event_id, 'period.manage') then raise exception 'Operational period management is not permitted' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('operational_period_id', p_operational_period_id, 'expected_version', p_expected_version, 'closure_note', v_note, 'incidents_reviewed', p_incidents_reviewed, 'actions_reviewed', p_actions_reviewed, 'log_reviewed', p_log_reviewed, 'perimeter_reviewed', p_perimeter_reviewed);
  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = v_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'period.close' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'operational_period_id')::uuid, (v_receipt.response_payload ->> 'version')::integer, false;
    return;
  end if;
  if v_period.status <> 'open' then raise exception 'This operational period is already closed' using errcode = '23505'; end if;
  if v_period.version <> p_expected_version then raise exception 'This operational period has changed since it was opened' using errcode = '40001'; end if;
  update public.operational_periods set status = 'closed', closed_at = now(), closed_by = v_actor_id, closure_note = v_note,
    incidents_reviewed = true, actions_reviewed = true, log_reviewed = true, perimeter_reviewed = true,
    version = public.operational_periods.version + 1 where id = v_period.id returning * into v_period;
  insert into public.operational_audit_events (organisation_id, event_id, action, actor_profile_id, operational_period_id, details)
    values (v_period.organisation_id, v_period.event_id, 'operational_period.closed', v_actor_id, v_period.id, jsonb_build_object('version', v_period.version));
  insert into public.operational_command_receipts (organisation_id, event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_period.organisation_id, v_period.event_id, v_actor_id, p_idempotency_key, 'period.close', v_fingerprint, jsonb_build_object('operational_period_id', v_period.id, 'version', v_period.version));
  return query select v_period.id, v_period.version, true;
end;
$$;
