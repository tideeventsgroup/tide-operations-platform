-- Adds two genuinely police-RMS-style capabilities, matched against real
-- reference material rather than invented from scratch:
--
-- 1. Structured suspect/person description fields (age band, gender, height
--    band, build, distinguishing features, clothing) — the same banded
--    descriptor framework UK police systems (and Auror's own person-search
--    filters) use for identification, replacing "type a paragraph and hope"
--    with fields that are actually filterable/comparable across records.
-- 2. A real crime classification on events (the ten Home Office/ONS
--    notifiable-offence categories used in England & Wales police recorded
--    crime statistics) plus a police reference number, so an event that is
--    actually a reportable crime carries the same classification a police
--    incident/crime report would — separate from event_categories, which is
--    SENTINEL's own operational category (Medical/Security/Crowd/...), not
--    a legal offence classification.
--
-- Both are optional, additive columns — no existing behaviour changes.

create type person_age_group as enum ('unknown', 'under_18', '18_25', '26_35', '36_50', 'over_50');
create type person_gender as enum ('male', 'female', 'unknown_other');
create type person_height_band as enum ('unknown', 'short', 'average', 'tall', 'very_tall');
create type person_build as enum ('unknown', 'slender', 'average', 'muscular', 'large');

alter table people
  add column age_group person_age_group,
  add column gender person_gender,
  add column height_band person_height_band,
  add column build person_build,
  add column distinguishing_features text,
  add column clothing_description text;

create table crime_classifications (
  code text primary key,
  name text not null,
  sort_order integer not null default 0
);

comment on table crime_classifications is
  'The ten Home Office/ONS notifiable-offence categories used in England & Wales '
  'police recorded crime statistics. Global, not per-organisation — this is a '
  'legal classification, not something an org customises like event_categories.';

insert into crime_classifications (code, name, sort_order) values
  ('violence_against_person', 'Violence against the person', 10),
  ('sexual_offences', 'Sexual offences', 20),
  ('robbery', 'Robbery', 30),
  ('theft_offences', 'Theft offences', 40),
  ('criminal_damage_arson', 'Criminal damage and arson', 50),
  ('drug_offences', 'Drug offences', 60),
  ('possession_of_weapons', 'Possession of weapons', 70),
  ('public_order_offences', 'Public order offences', 80),
  ('misc_crimes_against_society', 'Miscellaneous crimes against society', 90),
  ('fraud_offences', 'Fraud offences', 100);

alter table crime_classifications enable row level security;

create policy crime_classifications_select on crime_classifications
  for select to authenticated using (true);

alter table events
  add column crime_classification_code text references crime_classifications(code),
  add column police_reference text;

-- Guarded mutation: person description. Org-scoped (a person record isn't
-- owned by one event), same intelligence.manage permission create_person
-- already requires.
create function update_person_description(
  p_person_id uuid,
  p_age_group person_age_group default null,
  p_gender person_gender default null,
  p_height_band person_height_band default null,
  p_build person_build default null,
  p_distinguishing_features text default null,
  p_clothing_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person people%rowtype;
  v_before jsonb;
begin
  select * into v_person from people where id = p_person_id;
  if v_person.id is null then raise exception 'Person record not found'; end if;
  if not has_permission('intelligence.manage', v_person.organisation_id, null, null) then
    raise exception 'Not authorised to manage intelligence records for this organisation';
  end if;

  v_before := jsonb_build_object(
    'age_group', v_person.age_group, 'gender', v_person.gender,
    'height_band', v_person.height_band, 'build', v_person.build,
    'distinguishing_features', v_person.distinguishing_features,
    'clothing_description', v_person.clothing_description
  );

  update people set
    age_group = p_age_group,
    gender = p_gender,
    height_band = p_height_band,
    build = p_build,
    distinguishing_features = p_distinguishing_features,
    clothing_description = p_clothing_description
  where id = p_person_id;

  perform record_audit_event('person', p_person_id, 'update', v_person.organisation_id, null,
    v_before,
    jsonb_build_object(
      'age_group', p_age_group, 'gender', p_gender, 'height_band', p_height_band, 'build', p_build,
      'distinguishing_features', p_distinguishing_features, 'clothing_description', p_clothing_description
    ),
    null);
end;
$$;

-- Guarded mutation: event police details (crime classification + police
-- reference number). event.update is the same permission every other
-- event-field edit requires.
create function update_event_police_details(
  p_event_id uuid,
  p_crime_classification_code text default null,
  p_police_reference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_classification_name text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('event.update', v_event.organisation_id, null, v_event.operation_id) then
    raise exception 'Not authorised to update this event';
  end if;

  if p_crime_classification_code is not null then
    select name into v_classification_name from crime_classifications where code = p_crime_classification_code;
    if v_classification_name is null then raise exception 'Unknown crime classification'; end if;
  end if;

  update events set
    crime_classification_code = p_crime_classification_code,
    police_reference = nullif(trim(p_police_reference), '')
  where id = p_event_id;

  perform record_audit_event('event', p_event_id, 'update', v_event.organisation_id, v_event.operation_id,
    jsonb_build_object('crime_classification_code', v_event.crime_classification_code, 'police_reference', v_event.police_reference),
    jsonb_build_object('crime_classification_code', p_crime_classification_code, 'police_reference', p_police_reference),
    null);

  insert into event_log_entries (event_id, entry_type, body, author_id)
  values (
    p_event_id, 'update',
    case
      when p_crime_classification_code is not null and coalesce(trim(p_police_reference), '') <> ''
        then format('Police details recorded: %s (ref %s)', v_classification_name, p_police_reference)
      when p_crime_classification_code is not null
        then format('Crime classification recorded: %s', v_classification_name)
      when coalesce(trim(p_police_reference), '') <> ''
        then format('Police reference recorded: %s', p_police_reference)
      else 'Police details cleared'
    end,
    auth.uid()
  );
end;
$$;

revoke execute on function update_person_description(uuid, person_age_group, person_gender, person_height_band, person_build, text, text) from public, anon, authenticated;
revoke execute on function update_event_police_details(uuid, text, text) from public, anon, authenticated;

grant execute on function update_person_description(uuid, person_age_group, person_gender, person_height_band, person_build, text, text) to authenticated;
grant execute on function update_event_police_details(uuid, text, text) to authenticated;
