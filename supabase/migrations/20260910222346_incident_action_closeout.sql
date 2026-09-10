begin;

alter table public.command_receipts
  drop constraint command_receipts_command_type_check,
  add constraint command_receipts_command_type_check check (
    command_type in (
      'incident.report_received', 'incident.transition', 'incident.timeline.append',
      'incident.action.create', 'incident.action.acknowledge', 'incident.action.complete',
      'incident.action.verify', 'incident.decision.record'
    )
  );

create function public.update_incident_action_status(
  p_actor_id uuid,
  p_event_id uuid,
  p_incident_id uuid,
  p_incident_action_id uuid,
  p_target_status text,
  p_note text,
  p_idempotency_key uuid
)
returns table (incident_action_id uuid, receipt_id uuid, created boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_action public.incident_actions%rowtype; v_receipt public.command_receipts%rowtype; v_sequence integer;
  v_command_type text; v_timeline_type text; v_audit_action text; v_event_type text; v_fingerprint jsonb; v_note text := nullif(btrim(p_note), '');
begin
  if p_actor_id is null or not exists (select 1 from public.internal_users where id = p_actor_id and is_active) then raise exception 'A valid active operator is required' using errcode = '42501'; end if;
  if p_target_status not in ('completed', 'verified') or p_idempotency_key is null or coalesce(char_length(v_note), 0) > 2000 then raise exception 'A complete valid action update is required' using errcode = '22023'; end if;
  select action.* into v_action from public.incident_actions action join public.incidents incident on incident.id = action.incident_id where action.id = p_incident_action_id and action.event_id = p_event_id and action.incident_id = p_incident_id and incident.archived_at is null for update;
  if not found then raise exception 'Action is unavailable' using errcode = '42501'; end if;
  if (p_target_status = 'completed' and v_action.status not in ('assigned', 'acknowledged')) or (p_target_status = 'verified' and v_action.status <> 'completed') then raise exception 'This action cannot make that transition' using errcode = '22023'; end if;
  v_command_type := case p_target_status when 'completed' then 'incident.action.complete' else 'incident.action.verify' end;
  v_timeline_type := case p_target_status when 'completed' then 'action_completed' else 'action_verified' end;
  v_audit_action := case p_target_status when 'completed' then 'incident.action_completed' else 'incident.action_verified' end;
  v_event_type := case p_target_status when 'completed' then 'completed' else 'verified' end;
  v_fingerprint := jsonb_build_object('event_id', p_event_id, 'incident_id', p_incident_id, 'incident_action_id', p_incident_action_id, 'target_status', p_target_status, 'note', v_note);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0)); select * into v_receipt from public.command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then if v_receipt.command_type <> v_command_type or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if; return query select (v_receipt.response_payload ->> 'incident_action_id')::uuid, v_receipt.id, false; return; end if;
  update public.incident_actions set status = p_target_status, completed_at = case when p_target_status = 'completed' then now() else completed_at end, completed_by = case when p_target_status = 'completed' then p_actor_id else completed_by end, verified_at = case when p_target_status = 'verified' then now() else verified_at end, verified_by = case when p_target_status = 'verified' then p_actor_id else verified_by end, updated_at = now() where id = p_incident_action_id;
  insert into public.incident_action_events (event_id, incident_id, incident_action_id, event_type, actor_id, note) values (p_event_id, p_incident_id, p_incident_action_id, v_event_type, p_actor_id, v_note);
  select coalesce(max(sequence_number), 0) + 1 into v_sequence from public.incident_timeline_entries where incident_id = p_incident_id;
  insert into public.incident_timeline_entries (event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by) values (p_event_id, p_incident_id, v_sequence, v_timeline_type, 'operator', format('Action %s: %s.', p_target_status, v_action.title), now(), p_actor_id);
  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details) values (p_event_id, p_incident_id, v_audit_action, p_actor_id, jsonb_build_object('incident_action_id', p_incident_action_id, 'note', v_note));
  insert into public.operational_outbox (event_id, incident_id, topic, payload) values (p_event_id, p_incident_id, 'incident.action_updated', jsonb_build_object('incident_id', p_incident_id, 'incident_action_id', p_incident_action_id, 'status', p_target_status));
  insert into public.command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload) values (p_event_id, p_actor_id, p_idempotency_key, v_command_type, v_fingerprint, p_incident_id, jsonb_build_object('incident_action_id', p_incident_action_id)) returning * into v_receipt;
  return query select p_incident_action_id, v_receipt.id, true;
end;
$$;

revoke all on function public.update_incident_action_status(uuid, uuid, uuid, uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.update_incident_action_status(uuid, uuid, uuid, uuid, text, text, uuid) to service_role;

commit;
