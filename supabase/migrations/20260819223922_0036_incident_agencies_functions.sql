-- Guarded transitions, same pattern as 0027/0031. Reuses 'incident.update'
-- (agency liaison is incident-record detail, same as timeline entries) —
-- no new permission code needed.

create function notify_incident_agency(
  p_incident_id uuid,
  p_agency_type text,
  p_agency_name text,
  p_contact_name text default null,
  p_contact_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_agency_id uuid;
  v_reference text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;

  v_reference := next_event_reference(v_incident.event_id, 'AGY');

  insert into incident_agencies (incident_id, reference, agency_type, agency_name, contact_name, contact_number, notified_by)
  values (p_incident_id, v_reference, p_agency_type, p_agency_name, p_contact_name, p_contact_number, auth.uid())
  returning id into v_agency_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'agency', format('Agency notified: %s (%s)', p_agency_name, p_agency_type),
    auth.uid(), 'incident_agency', v_agency_id);

  return v_agency_id;
end;
$$;

create function update_incident_agency_status(p_agency_id uuid, p_status incident_agency_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency incident_agencies%rowtype;
  v_incident incidents%rowtype;
  v_status_label text;
begin
  select * into v_agency from incident_agencies where id = p_agency_id;
  if v_agency.id is null then raise exception 'Agency record not found'; end if;
  select * into v_incident from incidents where id = v_agency.incident_id;
  if not has_permission('incident.update', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to update this incident';
  end if;
  if v_agency.status = 'stood_down' then
    raise exception 'Agency is already stood down';
  end if;
  if p_status = v_agency.status then
    raise exception 'Agency is already in that status';
  end if;

  update incident_agencies set
    status = p_status,
    attending_at = case when p_status = 'attending' then now() else attending_at end,
    arrived_at = case when p_status = 'on_scene' then now() else arrived_at end,
    stood_down_at = case when p_status = 'stood_down' then now() else stood_down_at end
  where id = p_agency_id;

  v_status_label := case p_status
    when 'on_scene' then 'on scene'
    when 'stood_down' then 'stood down'
    else p_status::text
  end;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (v_agency.incident_id, 'agency', format('Agency %s: %s', v_status_label, v_agency.agency_name),
    auth.uid(), 'incident_agency', p_agency_id);
end;
$$;

revoke execute on function notify_incident_agency(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function update_incident_agency_status(uuid, incident_agency_status) from public, anon, authenticated;

grant execute on function notify_incident_agency(uuid, text, text, text, text) to authenticated;
grant execute on function update_incident_agency_status(uuid, incident_agency_status) to authenticated;
