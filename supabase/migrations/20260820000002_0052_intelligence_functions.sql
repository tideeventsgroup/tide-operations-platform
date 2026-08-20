-- Guarded creation/linking. No standalone "create a person" path exists —
-- create_person always requires an incident to link to in the same call,
-- so a person record can never be created as a bare directory entry.
-- Linking an already-existing record to a further incident (repeat subject,
-- banned individual turning up at a different event) is the separate,
-- lighter link_existing_* path. Restricted-classification records get a
-- record_audit_event() call on creation — see docs/data-classification.md's
-- "logged access" requirement for restricted data.

create function create_person(
  p_incident_id uuid,
  p_purpose text,
  p_role_code text,
  p_first_name text default null,
  p_surname text default null,
  p_description text default null,
  p_date_of_birth date default null,
  p_classification classification_level default 'restricted',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_person_id uuid;
  v_reference text;
  v_label text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('intelligence.manage', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to manage intelligence records for this incident';
  end if;
  if coalesce(trim(p_purpose), '') = '' then
    raise exception 'A purpose is required to create a person record';
  end if;

  v_reference := next_organisation_reference(v_incident.organisation_id, 'PER');

  insert into people (
    organisation_id, reference, first_name, surname, description,
    date_of_birth, classification, purpose, created_by
  )
  values (
    v_incident.organisation_id, v_reference, p_first_name, p_surname, p_description,
    p_date_of_birth, p_classification, p_purpose, auth.uid()
  )
  returning id into v_person_id;

  insert into incident_people (incident_id, person_id, role_code, notes, linked_by)
  values (p_incident_id, v_person_id, p_role_code, p_notes, auth.uid());

  v_label := coalesce(nullif(trim(concat_ws(' ', p_first_name, p_surname)), ''), v_reference);

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'intelligence', format('Person linked: %s (%s)', v_label, p_role_code),
    auth.uid(), 'person', v_person_id);

  perform record_audit_event('person', v_person_id, 'create', v_incident.organisation_id, v_incident.event_id,
    null, jsonb_build_object('reference', v_reference, 'classification', p_classification), p_purpose);

  return v_person_id;
end;
$$;

create function link_existing_person_to_incident(
  p_incident_id uuid,
  p_person_id uuid,
  p_role_code text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_person people%rowtype;
  v_link_id uuid;
  v_label text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('intelligence.manage', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to manage intelligence records for this incident';
  end if;

  select * into v_person from people where id = p_person_id;
  if v_person.id is null then raise exception 'Person record not found'; end if;
  if v_person.organisation_id != v_incident.organisation_id then
    raise exception 'Person record belongs to a different organisation';
  end if;

  insert into incident_people (incident_id, person_id, role_code, notes, linked_by)
  values (p_incident_id, p_person_id, p_role_code, p_notes, auth.uid())
  returning id into v_link_id;

  v_label := coalesce(nullif(trim(concat_ws(' ', v_person.first_name, v_person.surname)), ''), v_person.reference);

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'intelligence', format('Person linked: %s (%s)', v_label, p_role_code),
    auth.uid(), 'person', p_person_id);

  perform record_audit_event('person', p_person_id, 'link', v_incident.organisation_id, v_incident.event_id,
    null, jsonb_build_object('incident_id', p_incident_id, 'role_code', p_role_code), null);

  return v_link_id;
end;
$$;

create function create_vehicle(
  p_incident_id uuid,
  p_purpose text,
  p_role_code text,
  p_registration text default null,
  p_make text default null,
  p_model text default null,
  p_colour text default null,
  p_description text default null,
  p_classification classification_level default 'confidential',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_vehicle_id uuid;
  v_reference text;
  v_label text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('intelligence.manage', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to manage intelligence records for this incident';
  end if;
  if coalesce(trim(p_purpose), '') = '' then
    raise exception 'A purpose is required to create a vehicle record';
  end if;

  v_reference := next_organisation_reference(v_incident.organisation_id, 'VEH');

  insert into vehicles (
    organisation_id, reference, registration, make, model, colour,
    description, classification, purpose, created_by
  )
  values (
    v_incident.organisation_id, v_reference, p_registration, p_make, p_model, p_colour,
    p_description, p_classification, p_purpose, auth.uid()
  )
  returning id into v_vehicle_id;

  insert into incident_vehicles (incident_id, vehicle_id, role_code, notes, linked_by)
  values (p_incident_id, v_vehicle_id, p_role_code, p_notes, auth.uid());

  v_label := coalesce(nullif(trim(p_registration), ''), nullif(trim(concat_ws(' ', p_colour, p_make, p_model)), ''), v_reference);

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'intelligence', format('Vehicle linked: %s (%s)', v_label, p_role_code),
    auth.uid(), 'vehicle', v_vehicle_id);

  perform record_audit_event('vehicle', v_vehicle_id, 'create', v_incident.organisation_id, v_incident.event_id,
    null, jsonb_build_object('reference', v_reference, 'classification', p_classification), p_purpose);

  return v_vehicle_id;
end;
$$;

create function link_existing_vehicle_to_incident(
  p_incident_id uuid,
  p_vehicle_id uuid,
  p_role_code text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_vehicle vehicles%rowtype;
  v_link_id uuid;
  v_label text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('intelligence.manage', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to manage intelligence records for this incident';
  end if;

  select * into v_vehicle from vehicles where id = p_vehicle_id;
  if v_vehicle.id is null then raise exception 'Vehicle record not found'; end if;
  if v_vehicle.organisation_id != v_incident.organisation_id then
    raise exception 'Vehicle record belongs to a different organisation';
  end if;

  insert into incident_vehicles (incident_id, vehicle_id, role_code, notes, linked_by)
  values (p_incident_id, p_vehicle_id, p_role_code, p_notes, auth.uid())
  returning id into v_link_id;

  v_label := coalesce(nullif(trim(v_vehicle.registration), ''), v_vehicle.reference);

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'intelligence', format('Vehicle linked: %s (%s)', v_label, p_role_code),
    auth.uid(), 'vehicle', p_vehicle_id);

  perform record_audit_event('vehicle', p_vehicle_id, 'link', v_incident.organisation_id, v_incident.event_id,
    null, jsonb_build_object('incident_id', p_incident_id, 'role_code', p_role_code), null);

  return v_link_id;
end;
$$;

revoke execute on function create_person(uuid, text, text, text, text, text, date, classification_level, text) from public, anon, authenticated;
revoke execute on function link_existing_person_to_incident(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function create_vehicle(uuid, text, text, text, text, text, text, text, classification_level, text) from public, anon, authenticated;
revoke execute on function link_existing_vehicle_to_incident(uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function create_person(uuid, text, text, text, text, text, date, classification_level, text) to authenticated;
grant execute on function link_existing_person_to_incident(uuid, uuid, text, text) to authenticated;
grant execute on function create_vehicle(uuid, text, text, text, text, text, text, text, classification_level, text) to authenticated;
grant execute on function link_existing_vehicle_to_incident(uuid, uuid, text, text) to authenticated;
