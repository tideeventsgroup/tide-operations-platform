-- 20260909230000_internal_single_organisation.sql dropped every auth.uid()
-- based command function, but only create_incident_report was ever restored
-- (20260910001000, then 20260910001100). transition_incident,
-- record_perimeter_check, create_casualty_record, open_operational_period,
-- and close_operational_period were never ported to the internal actor-id
-- and capability model, so incident transitions, perimeter checks, casualty
-- records, and Event Control periods have been unreachable since the
-- cutover even though their API routes still call them. This restores all
-- five with the same business rules, driven by an explicit p_actor_id
-- instead of auth.uid(), authorised via app_private.has_internal_capability,
-- and grants execute to service_role only, matching create_incident_report.

begin;

-- Matches src/modules/identity/internal-auth.ts's capabilityRoles map: fmic
-- gets casualty.manage (medical coordination) but not period.manage or
-- perimeter.check, which stay with the roles that run Event Control.
insert into public.role_capabilities (role, capability_id) values
  ('admin', 'period.manage'), ('admin', 'perimeter.check'), ('admin', 'casualty.manage'),
  ('event_control', 'period.manage'), ('event_control', 'perimeter.check'), ('event_control', 'casualty.manage'),
  ('fmic', 'casualty.manage')
on conflict do nothing;

create function public.transition_incident(
  p_actor_id uuid,
  p_incident_id uuid,
  p_expected_version integer,
  p_target_status text,
  p_target_severity text,
  p_reason text,
  p_idempotency_key uuid
)
returns table (incident_id uuid, incident_reference text, version integer, receipt_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_incident public.incidents%rowtype;
  v_receipt public.command_receipts%rowtype;
  v_reason text := nullif(btrim(p_reason), '');
  v_status text;
  v_severity text;
  v_previous_status text;
  v_previous_severity text;
  v_fingerprint jsonb;
  v_receipt_id uuid;
  v_timeline_sequence integer;
begin
  if p_actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_incident_id is null or p_expected_version is null or p_idempotency_key is null or v_reason is null then
    raise exception 'Incident, version, reason, and idempotency key are required' using errcode = '22023';
  end if;

  if char_length(v_reason) > 1000 then
    raise exception 'Transition reason exceeds the 1000 character limit' using errcode = '22001';
  end if;

  if not app_private.has_internal_capability(p_actor_id, 'incident.manage') then
    raise exception 'Incident transition is not permitted' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt
  from public.command_receipts
  where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;

  if found then
    v_fingerprint := jsonb_build_object(
      'incident_id', p_incident_id,
      'expected_version', p_expected_version,
      'target_status', p_target_status,
      'target_severity', p_target_severity,
      'reason', v_reason
    );
    if v_receipt.command_type <> 'incident.transition' or v_receipt.request_fingerprint <> v_fingerprint then
      raise exception 'Idempotency key was already used for a different command' using errcode = '23505';
    end if;
    return query select v_receipt.incident_id, v_receipt.response_payload ->> 'incident_reference',
      (v_receipt.response_payload ->> 'version')::integer, v_receipt.id, false;
    return;
  end if;

  select * into v_incident from public.incidents where id = p_incident_id for update;
  if not found then
    raise exception 'Incident transition is not permitted' using errcode = '42501';
  end if;

  if v_incident.version <> p_expected_version then
    raise exception 'Incident has changed since it was opened' using errcode = '40001';
  end if;

  v_status := coalesce(p_target_status, v_incident.status);
  v_severity := coalesce(p_target_severity, v_incident.severity);
  v_previous_status := v_incident.status;
  v_previous_severity := v_incident.severity;
  v_fingerprint := jsonb_build_object(
    'incident_id', p_incident_id,
    'expected_version', p_expected_version,
    'target_status', p_target_status,
    'target_severity', p_target_severity,
    'reason', v_reason
  );

  if v_status = v_incident.status and v_severity = v_incident.severity then
    raise exception 'A transition must change the lifecycle state or severity' using errcode = '22023';
  end if;

  if p_target_severity is not null and not exists (
    select 1 from public.incident_severity_levels where code = p_target_severity and is_active
  ) then
    raise exception 'The requested severity is unavailable' using errcode = '22023';
  end if;

  if p_target_status is not null and not (
    (v_incident.status = 'received' and p_target_status = 'assessing') or
    (v_incident.status = 'assessing' and p_target_status = 'active') or
    (v_incident.status = 'active' and p_target_status = 'monitoring') or
    (v_incident.status = 'monitoring' and p_target_status = 'resolved') or
    (v_incident.status = 'resolved' and p_target_status = 'closed') or
    (v_incident.status = 'closed' and p_target_status = 'reopened') or
    (v_incident.status = 'reopened' and p_target_status = 'active')
  ) then
    raise exception 'The requested lifecycle transition is not allowed' using errcode = '22023';
  end if;

  update public.incidents
  set status = v_status,
      severity = v_severity,
      version = public.incidents.version + 1,
      updated_at = now()
  where id = v_incident.id
  returning * into v_incident;

  insert into public.command_receipts (
    event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload
  ) values (
    v_incident.event_id, p_actor_id, p_idempotency_key, 'incident.transition', v_fingerprint,
    v_incident.id, jsonb_build_object('incident_reference', v_incident.display_reference, 'version', v_incident.version)
  ) returning id into v_receipt_id;

  insert into public.incident_transitions (
    event_id, incident_id, command_receipt_id, previous_version, new_version,
    previous_status, new_status, previous_severity, new_severity, reason, transitioned_by
  ) values (
    v_incident.event_id, v_incident.id, v_receipt_id, v_incident.version - 1, v_incident.version,
    v_previous_status, v_incident.status, v_previous_severity, v_incident.severity, v_reason, p_actor_id
  );

  select coalesce(max(sequence_number), 0) + 1 into v_timeline_sequence
  from public.incident_timeline_entries where public.incident_timeline_entries.incident_id = v_incident.id;

  insert into public.incident_timeline_entries (
    event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by
  ) values (
    v_incident.event_id, v_incident.id, v_timeline_sequence, 'status_transition', 'system', v_reason, now(), p_actor_id
  );

  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details)
  values (v_incident.event_id, v_incident.id, 'incident.transitioned', p_actor_id,
    jsonb_build_object('status', v_incident.status, 'severity', v_incident.severity, 'version', v_incident.version));

  insert into public.operational_outbox (event_id, incident_id, topic, payload)
  values (v_incident.event_id, v_incident.id, 'incident.updated',
    jsonb_build_object('incident_id', v_incident.id, 'incident_reference', v_incident.display_reference, 'version', v_incident.version));

  return query select v_incident.id, v_incident.display_reference, v_incident.version, v_receipt_id, true;
end;
$$;

create function public.open_operational_period(
  p_actor_id uuid,
  p_event_id uuid,
  p_opening_note text,
  p_idempotency_key uuid
)
returns table (operational_period_id uuid, version integer, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_period public.operational_periods%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_note text := nullif(btrim(p_opening_note), '');
  v_fingerprint jsonb;
begin
  if p_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_event_id is null or p_idempotency_key is null then raise exception 'Event and idempotency key are required' using errcode = '22023'; end if;
  if v_note is not null and char_length(v_note) > 1000 then raise exception 'Opening note exceeds the 1000 character limit' using errcode = '22001'; end if;
  if not app_private.has_internal_capability(p_actor_id, 'period.manage') then raise exception 'Operational period management is not permitted' using errcode = '42501'; end if;

  v_fingerprint := jsonb_build_object('event_id', p_event_id, 'opening_note', v_note);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'period.open' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'operational_period_id')::uuid, (v_receipt.response_payload ->> 'version')::integer, false;
    return;
  end if;
  if exists (select 1 from public.operational_periods where event_id = p_event_id and status = 'open') then raise exception 'An operational period is already open for this event' using errcode = '23505'; end if;
  insert into public.operational_periods (event_id, opened_by, opening_note)
  select id, p_actor_id, v_note from public.events where id = p_event_id
  returning * into v_period;
  if not found then raise exception 'Event is unavailable' using errcode = '42501'; end if;
  insert into public.operational_audit_events (event_id, action, actor_profile_id, operational_period_id, details)
    values (v_period.event_id, 'operational_period.opened', p_actor_id, v_period.id, jsonb_build_object('version', v_period.version));
  insert into public.operational_command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_period.event_id, p_actor_id, p_idempotency_key, 'period.open', v_fingerprint, jsonb_build_object('operational_period_id', v_period.id, 'version', v_period.version));
  return query select v_period.id, v_period.version, true;
end;
$$;

create function public.close_operational_period(
  p_actor_id uuid,
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
set search_path = public, pg_temp
as $$
declare
  v_period public.operational_periods%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_note text := nullif(btrim(p_closure_note), '');
  v_fingerprint jsonb;
begin
  if p_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_operational_period_id is null or p_expected_version is null or p_idempotency_key is null or v_note is null then raise exception 'Period, version, closure note, and idempotency key are required' using errcode = '22023'; end if;
  if char_length(v_note) > 1000 then raise exception 'Closure note exceeds the 1000 character limit' using errcode = '22001'; end if;
  if not coalesce(p_incidents_reviewed, false) or not coalesce(p_actions_reviewed, false) or not coalesce(p_log_reviewed, false) or not coalesce(p_perimeter_reviewed, false) then raise exception 'All closure checks must be confirmed' using errcode = '22023'; end if;
  select * into v_period from public.operational_periods where id = p_operational_period_id for update;
  if not found or not app_private.has_internal_capability(p_actor_id, 'period.manage') then raise exception 'Operational period management is not permitted' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('operational_period_id', p_operational_period_id, 'expected_version', p_expected_version, 'closure_note', v_note, 'incidents_reviewed', p_incidents_reviewed, 'actions_reviewed', p_actions_reviewed, 'log_reviewed', p_log_reviewed, 'perimeter_reviewed', p_perimeter_reviewed);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'period.close' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'operational_period_id')::uuid, (v_receipt.response_payload ->> 'version')::integer, false;
    return;
  end if;
  if v_period.status <> 'open' then raise exception 'This operational period is already closed' using errcode = '23505'; end if;
  if v_period.version <> p_expected_version then raise exception 'This operational period has changed since it was opened' using errcode = '40001'; end if;
  update public.operational_periods set status = 'closed', closed_at = now(), closed_by = p_actor_id, closure_note = v_note,
    incidents_reviewed = true, actions_reviewed = true, log_reviewed = true, perimeter_reviewed = true,
    version = public.operational_periods.version + 1 where id = v_period.id returning * into v_period;
  insert into public.operational_audit_events (event_id, action, actor_profile_id, operational_period_id, details)
    values (v_period.event_id, 'operational_period.closed', p_actor_id, v_period.id, jsonb_build_object('version', v_period.version));
  insert into public.operational_command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_period.event_id, p_actor_id, p_idempotency_key, 'period.close', v_fingerprint, jsonb_build_object('operational_period_id', v_period.id, 'version', v_period.version));
  return query select v_period.id, v_period.version, true;
end;
$$;

create function public.record_perimeter_check(
  p_actor_id uuid,
  p_operational_period_id uuid,
  p_checkpoint_name text,
  p_status text,
  p_observation text,
  p_idempotency_key uuid
)
returns table (perimeter_check_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_period public.operational_periods%rowtype;
  v_check public.perimeter_checks%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_checkpoint text := nullif(btrim(p_checkpoint_name), '');
  v_observation text := nullif(btrim(p_observation), '');
  v_fingerprint jsonb;
begin
  if p_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_operational_period_id is null or p_idempotency_key is null or v_checkpoint is null or p_status not in ('secure', 'attention_required', 'not_checked') then raise exception 'Period, checkpoint, status, and idempotency key are required' using errcode = '22023'; end if;
  if char_length(v_checkpoint) > 160 or (v_observation is not null and char_length(v_observation) > 2000) then raise exception 'Perimeter check exceeds a field limit' using errcode = '22001'; end if;
  select * into v_period from public.operational_periods where id = p_operational_period_id for share;
  if not found or v_period.status <> 'open' or not app_private.has_internal_capability(p_actor_id, 'perimeter.check') then raise exception 'Perimeter checks are not permitted for this operational period' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('operational_period_id', p_operational_period_id, 'checkpoint_name', v_checkpoint, 'status', p_status, 'observation', v_observation);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'perimeter.check' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'perimeter_check_id')::uuid, false;
    return;
  end if;
  insert into public.perimeter_checks (event_id, operational_period_id, checkpoint_name, status, observation, recorded_by)
    values (v_period.event_id, v_period.id, v_checkpoint, p_status, v_observation, p_actor_id) returning * into v_check;
  insert into public.operational_audit_events (event_id, action, actor_profile_id, operational_period_id, details)
    values (v_period.event_id, 'perimeter_check.recorded', p_actor_id, v_period.id, jsonb_build_object('perimeter_check_id', v_check.id, 'status', v_check.status));
  insert into public.operational_command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_period.event_id, p_actor_id, p_idempotency_key, 'perimeter.check', v_fingerprint, jsonb_build_object('perimeter_check_id', v_check.id));
  return query select v_check.id, true;
end;
$$;

create function public.create_casualty_record(
  p_actor_id uuid,
  p_incident_id uuid,
  p_casualty_reference text,
  p_condition_state text,
  p_care_provider text,
  p_handover_status text,
  p_recording_reason text,
  p_idempotency_key uuid
)
returns table (casualty_record_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_incident public.incidents%rowtype;
  v_casualty public.casualty_records%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_reference text := nullif(btrim(p_casualty_reference), '');
  v_provider text := nullif(btrim(p_care_provider), '');
  v_reason text := nullif(btrim(p_recording_reason), '');
  v_fingerprint jsonb;
begin
  if p_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_incident_id is null or p_idempotency_key is null or v_reference is null or v_reason is null or p_condition_state not in ('unknown', 'minor', 'requires_medical_assessment', 'emergency_services_requested', 'transferred') or p_handover_status not in ('not_required', 'awaiting', 'completed') then raise exception 'Incident, anonymous reference, operational state, handover status, recording reason, and idempotency key are required' using errcode = '22023'; end if;
  if char_length(v_reference) > 40 or char_length(v_reason) > 500 or (v_provider is not null and char_length(v_provider) > 160) then raise exception 'Casualty record exceeds a field limit' using errcode = '22001'; end if;
  select * into v_incident from public.incidents where id = p_incident_id for share;
  if not found or not app_private.has_internal_capability(p_actor_id, 'casualty.manage') then raise exception 'Restricted casualty record access is not permitted' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('incident_id', p_incident_id, 'casualty_reference', v_reference, 'condition_state', p_condition_state, 'care_provider', v_provider, 'handover_status', p_handover_status, 'recording_reason', v_reason);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'casualty.create' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'casualty_record_id')::uuid, false;
    return;
  end if;
  insert into public.casualty_records (event_id, incident_id, casualty_reference, condition_state, care_provider, handover_status, recording_reason, recorded_by)
    values (v_incident.event_id, v_incident.id, v_reference, p_condition_state, v_provider, p_handover_status, v_reason, p_actor_id) returning * into v_casualty;
  insert into public.operational_audit_events (event_id, action, actor_profile_id, incident_id, details)
    values (v_incident.event_id, 'casualty_record.created', p_actor_id, v_incident.id, jsonb_build_object('casualty_record_id', v_casualty.id));
  insert into public.operational_command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_incident.event_id, p_actor_id, p_idempotency_key, 'casualty.create', v_fingerprint, jsonb_build_object('casualty_record_id', v_casualty.id));
  return query select v_casualty.id, true;
end;
$$;

revoke all on function public.transition_incident(uuid, uuid, integer, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.transition_incident(uuid, uuid, integer, text, text, text, uuid) to service_role;

revoke all on function public.open_operational_period(uuid, uuid, text, uuid),
  public.close_operational_period(uuid, uuid, integer, text, boolean, boolean, boolean, boolean, uuid),
  public.record_perimeter_check(uuid, uuid, text, text, text, uuid),
  public.create_casualty_record(uuid, uuid, text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.open_operational_period(uuid, uuid, text, uuid),
  public.close_operational_period(uuid, uuid, integer, text, boolean, boolean, boolean, boolean, uuid),
  public.record_perimeter_check(uuid, uuid, text, text, text, uuid),
  public.create_casualty_record(uuid, uuid, text, text, text, text, text, uuid) to service_role;

commit;
