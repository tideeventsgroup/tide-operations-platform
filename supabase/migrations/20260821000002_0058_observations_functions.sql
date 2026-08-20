create function create_observation(
  p_event_id uuid,
  p_category text,
  p_summary text,
  p_description text default null,
  p_location_id uuid default null,
  p_classification classification_level default 'internal',
  p_occurred_at timestamptz default now(),
  p_reported_by_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_observation_id uuid;
  v_reference text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('observation.create', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to log observations on this event';
  end if;

  v_reference := next_event_reference(p_event_id, 'OBS');

  insert into observations (
    organisation_id, event_id, reference, event_phase, category, summary, description,
    location_id, classification, reported_by_name, reported_by_profile_id, occurred_at, created_by
  ) values (
    v_event.organisation_id, p_event_id, v_reference, v_event.current_phase, p_category, p_summary, p_description,
    p_location_id, p_classification, p_reported_by_name, auth.uid(), p_occurred_at, auth.uid()
  )
  returning id into v_observation_id;

  return v_observation_id;
end;
$$;

-- Direct status changes only cover open/reviewed/dismissed. 'promoted' is
-- only ever set by promote_observation_to_incident() below, alongside the
-- incident it creates — never as a bare status flip with nothing behind it.
create function update_observation_status(
  p_observation_id uuid,
  p_status observation_status,
  p_dismissed_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_observation observations%rowtype;
begin
  select * into v_observation from observations where id = p_observation_id;
  if v_observation.id is null then raise exception 'Observation not found'; end if;
  if not has_permission('observation.manage', v_observation.organisation_id, null, v_observation.event_id) then
    raise exception 'Not authorised to manage observations on this event';
  end if;
  if v_observation.status = 'promoted' then
    raise exception 'Observation has already been promoted to an incident';
  end if;
  if p_status = 'promoted' then
    raise exception 'Use promote_observation_to_incident to promote an observation';
  end if;

  update observations set
    status = p_status,
    reviewed_by = case when p_status in ('reviewed', 'dismissed') then auth.uid() else reviewed_by end,
    reviewed_at = case when p_status in ('reviewed', 'dismissed') then now() else reviewed_at end,
    dismissed_reason = case when p_status = 'dismissed' then p_dismissed_reason else dismissed_reason end
  where id = p_observation_id;
end;
$$;

-- Creates a real incident from the observation's detail and links the two
-- records both ways (observations.promoted_incident_id, and an
-- incident_log_entries 'report' entry with linked_record_type
-- 'observation') so the intelligence trail stays connected.
create function promote_observation_to_incident(
  p_observation_id uuid,
  p_category_code text,
  p_priority_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_observation observations%rowtype;
  v_incident_id uuid;
begin
  select * into v_observation from observations where id = p_observation_id;
  if v_observation.id is null then raise exception 'Observation not found'; end if;
  if not has_permission('observation.manage', v_observation.organisation_id, null, v_observation.event_id) then
    raise exception 'Not authorised to manage observations on this event';
  end if;
  if not has_permission('incident.create', v_observation.organisation_id, null, v_observation.event_id) then
    raise exception 'Not authorised to create incidents on this event';
  end if;
  if v_observation.status = 'promoted' then
    raise exception 'Observation has already been promoted to an incident';
  end if;

  v_incident_id := create_incident(
    v_observation.event_id, p_category_code, v_observation.summary, v_observation.location_id,
    v_observation.description, p_priority_code, 'event_control_observation', v_observation.reported_by_name,
    v_observation.occurred_at
  );

  update observations set
    status = 'promoted',
    promoted_incident_id = v_incident_id,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_observation_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (v_incident_id, 'report', format('Promoted from observation %s', v_observation.reference),
    auth.uid(), 'observation', p_observation_id);

  return v_incident_id;
end;
$$;

revoke execute on function create_observation(uuid, text, text, text, uuid, classification_level, timestamptz, text) from public, anon, authenticated;
revoke execute on function update_observation_status(uuid, observation_status, text) from public, anon, authenticated;
revoke execute on function promote_observation_to_incident(uuid, text, text) from public, anon, authenticated;

grant execute on function create_observation(uuid, text, text, text, uuid, classification_level, timestamptz, text) to authenticated;
grant execute on function update_observation_status(uuid, observation_status, text) to authenticated;
grant execute on function promote_observation_to_incident(uuid, text, text) to authenticated;
