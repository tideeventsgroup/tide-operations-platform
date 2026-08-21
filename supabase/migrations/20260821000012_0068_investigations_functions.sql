create function create_investigation(
  p_organisation_id uuid,
  p_title text,
  p_summary text default null,
  p_classification classification_level default 'restricted',
  p_lead_investigator_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investigation_id uuid;
  v_reference text;
begin
  if not has_permission('investigation.manage', p_organisation_id, null, null) then
    raise exception 'Not authorised to open investigations';
  end if;

  v_reference := next_organisation_reference(p_organisation_id, 'INV');

  insert into investigations (organisation_id, reference, title, summary, classification, lead_investigator_id, opened_by)
  values (p_organisation_id, v_reference, p_title, p_summary, p_classification, p_lead_investigator_id, auth.uid())
  returning id into v_investigation_id;

  perform record_audit_event('investigation', v_investigation_id, 'opened', p_organisation_id, null,
    null, jsonb_build_object('reference', v_reference, 'title', p_title), p_summary);

  return v_investigation_id;
end;
$$;

create function link_incident_to_investigation(p_investigation_id uuid, p_incident_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investigation investigations%rowtype;
  v_incident incidents%rowtype;
  v_link_id uuid;
begin
  select * into v_investigation from investigations where id = p_investigation_id;
  if v_investigation.id is null then raise exception 'Investigation not found'; end if;
  if not has_permission('investigation.manage', v_investigation.organisation_id, null, null) then
    raise exception 'Not authorised to manage this investigation';
  end if;

  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if v_incident.organisation_id != v_investigation.organisation_id then
    raise exception 'Incident belongs to a different organisation';
  end if;

  insert into investigation_incidents (investigation_id, incident_id, linked_by)
  values (p_investigation_id, p_incident_id, auth.uid())
  returning id into v_link_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'intelligence', format('Linked to investigation %s', v_investigation.reference),
    auth.uid(), 'investigation', p_investigation_id);

  return v_link_id;
end;
$$;

create function link_person_to_investigation(p_investigation_id uuid, p_person_id uuid, p_role_code text, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investigation investigations%rowtype;
  v_person people%rowtype;
  v_link_id uuid;
begin
  select * into v_investigation from investigations where id = p_investigation_id;
  if v_investigation.id is null then raise exception 'Investigation not found'; end if;
  if not has_permission('investigation.manage', v_investigation.organisation_id, null, null) then
    raise exception 'Not authorised to manage this investigation';
  end if;

  select * into v_person from people where id = p_person_id;
  if v_person.id is null then raise exception 'Person record not found'; end if;
  if v_person.organisation_id != v_investigation.organisation_id then
    raise exception 'Person record belongs to a different organisation';
  end if;

  insert into investigation_people (investigation_id, person_id, role_code, notes, linked_by)
  values (p_investigation_id, p_person_id, p_role_code, p_notes, auth.uid())
  returning id into v_link_id;

  return v_link_id;
end;
$$;

create function link_vehicle_to_investigation(p_investigation_id uuid, p_vehicle_id uuid, p_role_code text, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investigation investigations%rowtype;
  v_vehicle vehicles%rowtype;
  v_link_id uuid;
begin
  select * into v_investigation from investigations where id = p_investigation_id;
  if v_investigation.id is null then raise exception 'Investigation not found'; end if;
  if not has_permission('investigation.manage', v_investigation.organisation_id, null, null) then
    raise exception 'Not authorised to manage this investigation';
  end if;

  select * into v_vehicle from vehicles where id = p_vehicle_id;
  if v_vehicle.id is null then raise exception 'Vehicle record not found'; end if;
  if v_vehicle.organisation_id != v_investigation.organisation_id then
    raise exception 'Vehicle record belongs to a different organisation';
  end if;

  insert into investigation_vehicles (investigation_id, vehicle_id, role_code, notes, linked_by)
  values (p_investigation_id, p_vehicle_id, p_role_code, p_notes, auth.uid())
  returning id into v_link_id;

  return v_link_id;
end;
$$;

create function link_evidence_to_investigation(p_investigation_id uuid, p_evidence_item_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investigation investigations%rowtype;
  v_evidence evidence_items%rowtype;
  v_link_id uuid;
begin
  select * into v_investigation from investigations where id = p_investigation_id;
  if v_investigation.id is null then raise exception 'Investigation not found'; end if;
  if not has_permission('investigation.manage', v_investigation.organisation_id, null, null) then
    raise exception 'Not authorised to manage this investigation';
  end if;

  select * into v_evidence from evidence_items where id = p_evidence_item_id;
  if v_evidence.id is null then raise exception 'Evidence item not found'; end if;
  if v_evidence.organisation_id != v_investigation.organisation_id then
    raise exception 'Evidence item belongs to a different organisation';
  end if;

  insert into investigation_evidence (investigation_id, evidence_item_id, linked_by)
  values (p_investigation_id, p_evidence_item_id, auth.uid())
  returning id into v_link_id;

  return v_link_id;
end;
$$;

create function add_investigation_note(p_investigation_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investigation investigations%rowtype;
  v_note_id uuid;
begin
  select * into v_investigation from investigations where id = p_investigation_id;
  if v_investigation.id is null then raise exception 'Investigation not found'; end if;
  if not has_permission('investigation.manage', v_investigation.organisation_id, null, null) then
    raise exception 'Not authorised to manage this investigation';
  end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Note body cannot be empty'; end if;

  insert into investigation_notes (investigation_id, body, author_id)
  values (p_investigation_id, p_body, auth.uid())
  returning id into v_note_id;

  return v_note_id;
end;
$$;

create function update_investigation_status(p_investigation_id uuid, p_status investigation_status, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investigation investigations%rowtype;
begin
  select * into v_investigation from investigations where id = p_investigation_id;
  if v_investigation.id is null then raise exception 'Investigation not found'; end if;
  if not has_permission('investigation.manage', v_investigation.organisation_id, null, null) then
    raise exception 'Not authorised to manage this investigation';
  end if;
  if v_investigation.status = 'archived' then
    raise exception 'Investigation is already archived';
  end if;
  if p_status = 'closed' and coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required to close an investigation';
  end if;

  update investigations set
    status = p_status,
    closed_at = case when p_status = 'closed' then now() else closed_at end,
    closed_reason = case when p_status = 'closed' then p_reason else closed_reason end
  where id = p_investigation_id;

  perform record_audit_event('investigation', p_investigation_id, 'status_changed', v_investigation.organisation_id, null,
    jsonb_build_object('status', v_investigation.status), jsonb_build_object('status', p_status), p_reason);
end;
$$;

revoke execute on function create_investigation(uuid, text, text, classification_level, uuid) from public, anon, authenticated;
revoke execute on function link_incident_to_investigation(uuid, uuid) from public, anon, authenticated;
revoke execute on function link_person_to_investigation(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function link_vehicle_to_investigation(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function link_evidence_to_investigation(uuid, uuid) from public, anon, authenticated;
revoke execute on function add_investigation_note(uuid, text) from public, anon, authenticated;
revoke execute on function update_investigation_status(uuid, investigation_status, text) from public, anon, authenticated;

grant execute on function create_investigation(uuid, text, text, classification_level, uuid) to authenticated;
grant execute on function link_incident_to_investigation(uuid, uuid) to authenticated;
grant execute on function link_person_to_investigation(uuid, uuid, text, text) to authenticated;
grant execute on function link_vehicle_to_investigation(uuid, uuid, text, text) to authenticated;
grant execute on function link_evidence_to_investigation(uuid, uuid) to authenticated;
grant execute on function add_investigation_note(uuid, text) to authenticated;
grant execute on function update_investigation_status(uuid, investigation_status, text) to authenticated;
