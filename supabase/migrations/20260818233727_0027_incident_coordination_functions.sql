-- Guarded transitions for actions/decisions/resources. Same pattern as
-- 0024: SECURITY DEFINER functions do their own has_permission() check
-- since they bypass RLS by design. Resource dispatch reuses
-- 'incident.assign' (its description already covers "dispatch resources");
-- actions/decisions reuse 'incident.update' (they're incident-record
-- detail, same as timeline entries) — no new permission codes needed.

create function create_incident_action(
  p_incident_id uuid,
  p_description text,
  p_assigned_to uuid default null,
  p_due_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_action_id uuid;
  v_reference text;
  v_assignee_name text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then
    raise exception 'Incident not found';
  end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;

  v_reference := next_event_reference(v_incident.event_id, 'ACT');

  insert into incident_actions (incident_id, reference, description, assigned_to, due_at, created_by)
  values (p_incident_id, v_reference, p_description, p_assigned_to, p_due_at, auth.uid())
  returning id into v_action_id;

  if p_assigned_to is not null then
    select coalesce(first_name || ' ' || surname, email) into v_assignee_name from profiles where id = p_assigned_to;
  end if;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'action', format('Action logged: %s%s', p_description,
    case when v_assignee_name is not null then ' (assigned to ' || v_assignee_name || ')' else '' end),
    auth.uid(), 'incident_action', v_action_id);

  return v_action_id;
end;
$$;

create function complete_incident_action(p_action_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action incident_actions%rowtype;
  v_incident incidents%rowtype;
begin
  select * into v_action from incident_actions where id = p_action_id;
  if v_action.id is null then raise exception 'Action not found'; end if;
  select * into v_incident from incidents where id = v_action.incident_id;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;
  if v_action.status in ('complete', 'cancelled') then
    raise exception 'Action is already complete or cancelled';
  end if;

  update incident_actions set status = 'complete', completed_at = now(), completed_by = auth.uid()
  where id = p_action_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (v_action.incident_id, 'action', format('Action complete: %s%s', v_action.description,
    case when p_note is not null then '. ' || p_note else '' end),
    auth.uid(), 'incident_action', p_action_id);
end;
$$;

create function cancel_incident_action(p_action_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action incident_actions%rowtype;
  v_incident incidents%rowtype;
begin
  select * into v_action from incident_actions where id = p_action_id;
  if v_action.id is null then raise exception 'Action not found'; end if;
  select * into v_incident from incidents where id = v_action.incident_id;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;
  if v_action.status in ('complete', 'cancelled') then
    raise exception 'Action is already complete or cancelled';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A reason is required to cancel an action';
  end if;

  update incident_actions set status = 'cancelled', cancelled_at = now(), cancellation_reason = p_reason
  where id = p_action_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (v_action.incident_id, 'action', format('Action cancelled: %s. Reason: %s', v_action.description, p_reason),
    auth.uid(), 'incident_action', p_action_id);
end;
$$;

create function record_incident_decision(p_incident_id uuid, p_decision text, p_rationale text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_decision_id uuid;
  v_reference text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;

  v_reference := next_event_reference(v_incident.event_id, 'DEC');

  insert into incident_decisions (incident_id, reference, decision, rationale, decided_by)
  values (p_incident_id, v_reference, p_decision, p_rationale, auth.uid())
  returning id into v_decision_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'decision', format('Decision: %s%s', p_decision,
    case when p_rationale is not null then '. Rationale: ' || p_rationale else '' end),
    auth.uid(), 'incident_decision', v_decision_id);

  return v_decision_id;
end;
$$;

create function request_incident_resource(p_incident_id uuid, p_resource_type text, p_description text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_resource_id uuid;
  v_reference text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.assign', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to dispatch resources on this incident';
  end if;

  v_reference := next_event_reference(v_incident.event_id, 'RES');

  insert into incident_resources (incident_id, reference, resource_type, description, requested_by)
  values (p_incident_id, v_reference, p_resource_type, p_description, auth.uid())
  returning id into v_resource_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'dispatch', format('Resource requested: %s%s', p_resource_type,
    case when p_description is not null then ' — ' || p_description else '' end),
    auth.uid(), 'incident_resource', v_resource_id);

  return v_resource_id;
end;
$$;

create function update_incident_resource_status(p_resource_id uuid, p_status incident_resource_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resource incident_resources%rowtype;
  v_incident incidents%rowtype;
  v_entry_type incident_log_entry_type;
begin
  select * into v_resource from incident_resources where id = p_resource_id;
  if v_resource.id is null then raise exception 'Resource not found'; end if;
  select * into v_incident from incidents where id = v_resource.incident_id;
  if not has_permission('incident.assign', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to dispatch resources on this incident';
  end if;
  if v_resource.status = 'stood_down' then
    raise exception 'Resource is already stood down';
  end if;
  if p_status = v_resource.status then
    raise exception 'Resource is already in that status';
  end if;

  update incident_resources set
    status = p_status,
    dispatched_at = case when p_status = 'dispatched' then now() else dispatched_at end,
    arrived_at = case when p_status = 'on_scene' then now() else arrived_at end,
    stood_down_at = case when p_status = 'stood_down' then now() else stood_down_at end
  where id = p_resource_id;

  v_entry_type := case p_status
    when 'on_scene' then 'arrival'
    when 'dispatched' then 'dispatch'
    else 'system'
  end;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (v_resource.incident_id, v_entry_type, format('Resource %s: %s', p_status, v_resource.resource_type),
    auth.uid(), 'incident_resource', p_resource_id);
end;
$$;

-- Closure checklist, completed (spec §97) — now blocks on outstanding
-- actions and resources still in the field, not just incident status.
create or replace function close_incident(p_incident_id uuid, p_closure_summary text)
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
  if exists (select 1 from incident_actions where incident_id = p_incident_id and status in ('open', 'in_progress')) then
    raise exception 'Cannot close: outstanding actions remain open';
  end if;
  if exists (select 1 from incident_resources where incident_id = p_incident_id and status not in ('stood_down')) then
    raise exception 'Cannot close: resources are still dispatched or on scene';
  end if;

  update incidents set status = 'closed', closed_at = now(), closed_by = auth.uid(), closure_summary = p_closure_summary
  where id = p_incident_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'status', 'Closed: ' || p_closure_summary, auth.uid());

  perform record_audit_event('incident', p_incident_id, 'closed', p_event_id := v_incident.event_id,
    p_reason := p_closure_summary);
end;
$$;

revoke execute on function create_incident_action(uuid, text, uuid, timestamptz) from public, anon, authenticated;
revoke execute on function complete_incident_action(uuid, text) from public, anon, authenticated;
revoke execute on function cancel_incident_action(uuid, text) from public, anon, authenticated;
revoke execute on function record_incident_decision(uuid, text, text) from public, anon, authenticated;
revoke execute on function request_incident_resource(uuid, text, text) from public, anon, authenticated;
revoke execute on function update_incident_resource_status(uuid, incident_resource_status) from public, anon, authenticated;
revoke execute on function close_incident(uuid, text) from public, anon, authenticated;

grant execute on function create_incident_action(uuid, text, uuid, timestamptz) to authenticated;
grant execute on function complete_incident_action(uuid, text) to authenticated;
grant execute on function cancel_incident_action(uuid, text) to authenticated;
grant execute on function record_incident_decision(uuid, text, text) to authenticated;
grant execute on function request_incident_resource(uuid, text, text) to authenticated;
grant execute on function update_incident_resource_status(uuid, incident_resource_status) to authenticated;
grant execute on function close_incident(uuid, text) to authenticated;
