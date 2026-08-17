-- Guarded transitions for the incident domain (docs/incident-control.md
-- §"Guarded transitions"). Every function does its own authorisation
-- check because SECURITY DEFINER bypasses RLS by design.

create function create_incident(
  p_event_id uuid,
  p_category_code text,
  p_summary text,
  p_location_id uuid default null,
  p_description text default null,
  p_priority_code text default null,
  p_report_source report_source default 'other',
  p_reported_by_name text default null,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_incident_id uuid;
  v_reference text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'Event not found';
  end if;
  if not has_permission('incident.create', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to create incidents on this event';
  end if;

  v_reference := next_event_reference(p_event_id, 'INC');

  insert into incidents (
    organisation_id, event_id, reference, event_phase, category_code, priority_code,
    location_id, summary, description, report_source, reported_by_name,
    reported_by_profile_id, occurred_at, created_by
  ) values (
    v_event.organisation_id, p_event_id, v_reference, v_event.current_phase, p_category_code, p_priority_code,
    p_location_id, p_summary, p_description, p_report_source, p_reported_by_name,
    auth.uid(), p_occurred_at, auth.uid()
  )
  returning id into v_incident_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, occurred_at)
  values (v_incident_id, 'report', p_summary, auth.uid(), p_occurred_at);

  perform record_audit_event('incident', v_incident_id, 'created',
    p_event_id := p_event_id,
    p_after_state := jsonb_build_object('reference', v_reference, 'category', p_category_code, 'priority', p_priority_code));

  return v_incident_id;
end;
$$;

create function append_incident_log_entry(
  p_incident_id uuid,
  p_entry_type incident_log_entry_type,
  p_body text,
  p_occurred_at timestamptz default now(),
  p_linked_record_type text default null,
  p_linked_record_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_entry_id uuid;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then
    raise exception 'Incident not found';
  end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, occurred_at, linked_record_type, linked_record_id)
  values (p_incident_id, p_entry_type, p_body, auth.uid(), p_occurred_at, p_linked_record_type, p_linked_record_id)
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

-- Corrections supersede rather than edit (spec §50).
create function add_incident_correction(p_incident_id uuid, p_corrects_entry_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_entry_id uuid;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then
    raise exception 'Incident not found';
  end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;
  if not exists (select 1 from incident_log_entries where id = p_corrects_entry_id and incident_id = p_incident_id) then
    raise exception 'Entry to correct not found on this incident';
  end if;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, corrects_entry_id)
  values (p_incident_id, 'correction', p_body, auth.uid(), p_corrects_entry_id)
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

create function acknowledge_incident(p_incident_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;
  if v_incident.status <> 'reported' then
    raise exception 'Only a reported incident can be acknowledged';
  end if;

  update incidents set status = 'acknowledged', acknowledged_at = now() where id = p_incident_id;
  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'status', 'Acknowledged by Event Control.', auth.uid());
end;
$$;

-- "Take Control" (spec §54) — controller assignment, separate from owner.
create function assign_incident_controller(p_incident_id uuid, p_controller_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_controller uuid := coalesce(p_controller_id, auth.uid());
  v_controller_name text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.assign', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to assign this incident';
  end if;

  update incidents set controller_id = v_controller,
    status = case when status = 'reported' then 'acknowledged' else status end,
    acknowledged_at = coalesce(acknowledged_at, now())
  where id = p_incident_id;

  select coalesce(first_name || ' ' || surname, email) into v_controller_name from profiles where id = v_controller;
  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'system', format('Controller assigned: %s', v_controller_name), auth.uid());
end;
$$;

create function assign_incident_owner(p_incident_id uuid, p_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_owner_name text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.assign', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to assign this incident';
  end if;

  update incidents set owner_id = p_owner_id where id = p_incident_id;

  select coalesce(first_name || ' ' || surname, email) into v_owner_name from profiles where id = p_owner_id;
  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'system', format('Incident owner assigned: %s', v_owner_name), auth.uid());
end;
$$;

create function change_incident_priority(p_incident_id uuid, p_new_priority_code text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;
  if not exists (select 1 from incident_priorities where organisation_id = v_incident.organisation_id and code = p_new_priority_code) then
    raise exception 'Unknown priority code for this organisation';
  end if;

  update incidents set priority_code = p_new_priority_code where id = p_incident_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'status', format('Priority changed from %s to %s.%s',
    coalesce(v_incident.priority_code, 'unset'), p_new_priority_code,
    case when p_reason is not null then ' Reason: ' || p_reason else '' end), auth.uid());

  perform record_audit_event('incident', p_incident_id, 'priority_changed',
    p_event_id := v_incident.event_id,
    p_before_state := jsonb_build_object('priority', v_incident.priority_code),
    p_after_state := jsonb_build_object('priority', p_new_priority_code),
    p_reason := p_reason);
end;
$$;

create function resolve_incident(p_incident_id uuid, p_resolution text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.resolve', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to resolve this incident';
  end if;
  if v_incident.status in ('resolved', 'closed') then
    raise exception 'Incident is already resolved or closed';
  end if;

  update incidents set status = 'resolved', resolved_at = now(), resolution = p_resolution where id = p_incident_id;
  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'status', 'Resolved: ' || p_resolution, auth.uid());
end;
$$;

-- Closure checklist (spec §97) is partial for now — outstanding
-- actions/agencies/decisions checks land in Phase 4 once those tables
-- exist. Today: requires the incident to be resolved first.
create function close_incident(p_incident_id uuid, p_closure_summary text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.close', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to close this incident';
  end if;
  if v_incident.status <> 'resolved' then
    raise exception 'Resolve the incident before closing it';
  end if;

  update incidents set status = 'closed', closed_at = now(), closed_by = auth.uid(), closure_summary = p_closure_summary
  where id = p_incident_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'status', 'Closed: ' || p_closure_summary, auth.uid());

  perform record_audit_event('incident', p_incident_id, 'closed', p_event_id := v_incident.event_id,
    p_reason := p_closure_summary);
end;
$$;

-- Reopening never erases the original closure (spec §98).
create function reopen_incident(p_incident_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.reopen', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to reopen this incident';
  end if;
  if v_incident.status <> 'closed' then
    raise exception 'Only a closed incident can be reopened';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A reason is required to reopen an incident';
  end if;

  update incidents set status = 'active' where id = p_incident_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'status', 'Reopened. Reason: ' || p_reason, auth.uid());

  perform record_audit_event('incident', p_incident_id, 'reopened', p_event_id := v_incident.event_id, p_reason := p_reason);
end;
$$;

revoke execute on function create_incident(uuid, text, text, uuid, text, text, report_source, text, timestamptz) from public, anon;
revoke execute on function append_incident_log_entry(uuid, incident_log_entry_type, text, timestamptz, text, uuid) from public, anon;
revoke execute on function add_incident_correction(uuid, uuid, text) from public, anon;
revoke execute on function acknowledge_incident(uuid) from public, anon;
revoke execute on function assign_incident_controller(uuid, uuid) from public, anon;
revoke execute on function assign_incident_owner(uuid, uuid) from public, anon;
revoke execute on function change_incident_priority(uuid, text, text) from public, anon;
revoke execute on function resolve_incident(uuid, text) from public, anon;
revoke execute on function close_incident(uuid, text) from public, anon;
revoke execute on function reopen_incident(uuid, text) from public, anon;

grant execute on function create_incident(uuid, text, text, uuid, text, text, report_source, text, timestamptz) to authenticated;
grant execute on function append_incident_log_entry(uuid, incident_log_entry_type, text, timestamptz, text, uuid) to authenticated;
grant execute on function add_incident_correction(uuid, uuid, text) to authenticated;
grant execute on function acknowledge_incident(uuid) to authenticated;
grant execute on function assign_incident_controller(uuid, uuid) to authenticated;
grant execute on function assign_incident_owner(uuid, uuid) to authenticated;
grant execute on function change_incident_priority(uuid, text, text) to authenticated;
grant execute on function resolve_incident(uuid, text) to authenticated;
grant execute on function close_incident(uuid, text) to authenticated;
grant execute on function reopen_incident(uuid, text) to authenticated;
