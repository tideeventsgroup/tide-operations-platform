-- Two new permission codes for Phase 5. Signing onto the duty roster and
-- declaring Major Incident Mode are both operational control-room actions
-- distinct from ordinary incident.update, so they get their own codes
-- rather than overloading an existing one.
insert into permissions (code, module, action, description) values
  ('event.control_session.manage', 'event', 'control_session.manage', 'Sign on/off the Event Control duty roster'),
  ('incident.major_incident_mode', 'incident', 'major_incident_mode', 'Activate or deactivate Major Incident Mode');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.control_session.manage')
where r.code in ('event_control_manager', 'event_controller', 'deputy_controller',
                  'security_manager', 'medical_manager', 'stewarding_manager', 'team_leader');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('incident.major_incident_mode')
where r.code in ('event_control_manager', 'event_controller', 'deputy_controller');

-- Duty roster: sign on/off. A session's role must belong to the same
-- organisation as the event (event_control_roles.organisation_id).
create function start_control_session(p_event_id uuid, p_role_id uuid, p_profile_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_profile_id uuid := coalesce(p_profile_id, auth.uid());
  v_session_id uuid;
  v_role_name text;
  v_person_name text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('event.control_session.manage', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to manage the control roster for this event';
  end if;
  if not exists (select 1 from event_control_roles where id = p_role_id and organisation_id = v_event.organisation_id) then
    raise exception 'Unknown control role for this organisation';
  end if;
  if exists (select 1 from event_control_sessions where event_id = p_event_id and profile_id = v_profile_id and ended_at is null) then
    raise exception 'This person is already signed on to the duty roster';
  end if;

  insert into event_control_sessions (event_id, profile_id, role_id, started_by)
  values (p_event_id, v_profile_id, p_role_id, auth.uid())
  returning id into v_session_id;

  select name into v_role_name from event_control_roles where id = p_role_id;
  select coalesce(first_name || ' ' || surname, email) into v_person_name from profiles where id = v_profile_id;

  perform record_audit_event('event_control_session', v_session_id, 'started', p_event_id := p_event_id,
    p_after_state := jsonb_build_object('profile_id', v_profile_id, 'role', v_role_name));

  return v_session_id;
end;
$$;

create function end_control_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session event_control_sessions%rowtype;
  v_event events%rowtype;
begin
  select * into v_session from event_control_sessions where id = p_session_id;
  if v_session.id is null then raise exception 'Session not found'; end if;
  if v_session.ended_at is not null then raise exception 'Session already ended'; end if;
  select * into v_event from events where id = v_session.event_id;
  if not has_permission('event.control_session.manage', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to manage the control roster for this event';
  end if;

  update event_control_sessions set ended_at = now(), ended_by = auth.uid() where id = p_session_id;

  perform record_audit_event('event_control_session', p_session_id, 'ended', p_event_id := v_session.event_id);
end;
$$;

-- M/ETHANE — always a new version, never an edit.
create function create_methane_message(
  p_incident_id uuid,
  p_major_incident_declared boolean,
  p_exact_location text,
  p_incident_type text,
  p_hazards text default null,
  p_access_and_egress text default null,
  p_casualties text default null,
  p_emergency_services text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_message_id uuid;
  v_reference text;
  v_next_version int;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;

  select id into v_message_id from methane_messages where incident_id = p_incident_id;

  if v_message_id is null then
    v_reference := next_event_reference(v_incident.event_id, 'METHANE');
    insert into methane_messages (incident_id, reference, created_by)
    values (p_incident_id, v_reference, auth.uid())
    returning id into v_message_id;
    v_next_version := 1;
  else
    select coalesce(max(version_no), 0) + 1 into v_next_version from methane_message_versions where methane_message_id = v_message_id;
  end if;

  insert into methane_message_versions (
    methane_message_id, version_no, major_incident_declared, exact_location, incident_type,
    hazards, access_and_egress, casualties, emergency_services, submitted_by
  ) values (
    v_message_id, v_next_version, p_major_incident_declared, p_exact_location, p_incident_type,
    p_hazards, p_access_and_egress, p_casualties, p_emergency_services, auth.uid()
  );

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'update', format('M/ETHANE submitted (version %s)', v_next_version),
    auth.uid(), 'methane_message', v_message_id);

  return v_message_id;
end;
$$;

-- Major Incident Mode. Never dispatches or contacts anyone — a record
-- only. See docs/incident-control.md for the fixed disclaimer text, which
-- lives in the UI layer, not the database.
create function activate_major_incident(p_incident_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_activation_id uuid;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.major_incident_mode', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to activate Major Incident Mode';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A reason is required to activate Major Incident Mode';
  end if;
  if exists (select 1 from major_incident_activations where incident_id = p_incident_id and deactivated_at is null) then
    raise exception 'Major Incident Mode is already active for this incident';
  end if;

  insert into major_incident_activations (incident_id, activated_by, reason)
  values (p_incident_id, auth.uid(), p_reason)
  returning id into v_activation_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'escalation', 'Major Incident Mode activated. Reason: ' || p_reason,
    auth.uid(), 'major_incident_activation', v_activation_id);

  perform record_audit_event('incident', p_incident_id, 'major_incident_activated', p_event_id := v_incident.event_id,
    p_reason := p_reason);

  return v_activation_id;
end;
$$;

create function deactivate_major_incident(p_incident_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_activation_id uuid;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.major_incident_mode', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to deactivate Major Incident Mode';
  end if;

  select id into v_activation_id from major_incident_activations where incident_id = p_incident_id and deactivated_at is null;
  if v_activation_id is null then raise exception 'Major Incident Mode is not active for this incident'; end if;

  update major_incident_activations set deactivated_at = now(), deactivated_by = auth.uid() where id = v_activation_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'escalation', format('Major Incident Mode deactivated.%s',
    case when p_reason is not null then ' ' || p_reason else '' end),
    auth.uid(), 'major_incident_activation', v_activation_id);

  perform record_audit_event('incident', p_incident_id, 'major_incident_deactivated', p_event_id := v_incident.event_id,
    p_reason := p_reason);
end;
$$;

revoke execute on function start_control_session(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function end_control_session(uuid) from public, anon, authenticated;
revoke execute on function create_methane_message(uuid, boolean, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function activate_major_incident(uuid, text) from public, anon, authenticated;
revoke execute on function deactivate_major_incident(uuid, text) from public, anon, authenticated;

grant execute on function start_control_session(uuid, uuid, uuid) to authenticated;
grant execute on function end_control_session(uuid) to authenticated;
grant execute on function create_methane_message(uuid, boolean, text, text, text, text, text, text) to authenticated;
grant execute on function activate_major_incident(uuid, text) to authenticated;
grant execute on function deactivate_major_incident(uuid, text) to authenticated;
