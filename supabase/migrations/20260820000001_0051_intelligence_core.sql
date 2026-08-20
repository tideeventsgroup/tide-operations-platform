-- SENTINEL intelligence layer: People and Vehicles as first-class records
-- that can be linked to incidents (Auror-inspired, scoped down per the
-- user's explicit v1 constraints — see docs/data-classification.md and
-- the note on this table below). No facial recognition, no automatic
-- biometric matching. A person/vehicle record only ever comes into
-- existence through create_person/create_vehicle (0052), which requires
-- an operational purpose and an incident link in the same call — there is
-- no path to create a standalone "everyone" directory entry.

-- People/vehicles are organisation-scoped, not event-scoped (the same
-- person can recur across events), so they need their own reference
-- counter — next_event_reference (0023) is keyed to a single event.
create table organisation_id_counters (
  organisation_id uuid not null references organisations (id) on delete cascade,
  entity_type text not null,
  seq bigint not null default 0,
  primary key (organisation_id, entity_type)
);

comment on table organisation_id_counters is 'Backing store for next_organisation_reference(). Never queried directly by application code.';

create function next_organisation_reference(
  p_organisation_id uuid,
  p_entity_type text,
  p_suffix_width int default 4
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq bigint;
  v_org_code text;
begin
  insert into organisation_id_counters (organisation_id, entity_type, seq)
  values (p_organisation_id, p_entity_type, 1)
  on conflict (organisation_id, entity_type)
  do update set seq = organisation_id_counters.seq + 1
  returning seq into v_seq;

  select code into v_org_code from organisations where id = p_organisation_id;

  return format('%s-%s-%s', v_org_code, p_entity_type, lpad(v_seq::text, p_suffix_width, '0'));
end;
$$;

revoke execute on function next_organisation_reference(uuid, text, int) from public, anon, authenticated;

create type intelligence_record_status as enum ('active', 'archived');

-- Human-created person record, not an automatic biometric profile. `purpose`
-- is mandatory — it's the recorded operational justification for why this
-- record exists at all, since person records must not be created casually
-- (see the comment on create_person in 0052). Classified restricted by
-- default: this is exactly the "sensitive security/investigation" category
-- in docs/data-classification.md.
create table people (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  reference text not null unique,
  first_name text,
  surname text,
  description text,
  date_of_birth date,
  classification classification_level not null default 'restricted',
  purpose text not null,
  status intelligence_record_status not null default 'active',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table people is 'Human-created person record for incident intelligence. Never created without an operational purpose and an incident link — see create_person() in 0052. No facial recognition or automatic biometric identification feeds this table.';

create index people_organisation_id_idx on people (organisation_id, status);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  reference text not null unique,
  registration text,
  make text,
  model text,
  colour text,
  description text,
  classification classification_level not null default 'confidential',
  purpose text not null,
  status intelligence_record_status not null default 'active',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table vehicles is 'Vehicle record for incident intelligence. Created only via create_vehicle() in 0052, always with an operational purpose and an incident link.';

create index vehicles_organisation_id_idx on vehicles (organisation_id, status);
create index vehicles_registration_idx on vehicles (registration) where registration is not null;

-- role_code is free text, same rationale as incident_agencies.agency_type:
-- how a person/vehicle relates to an incident (witness, subject of concern,
-- missing, banned individual, suspect vehicle, ANPR match...) varies too
-- much to force into an enum.
create table incident_people (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  person_id uuid not null references people (id) on delete restrict,
  role_code text not null,
  notes text,
  linked_by uuid references profiles (id) on delete set null,
  linked_at timestamptz not null default now(),
  unique (incident_id, person_id)
);

create index incident_people_incident_id_idx on incident_people (incident_id);
create index incident_people_person_id_idx on incident_people (person_id);

create table incident_vehicles (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id) on delete restrict,
  role_code text not null,
  notes text,
  linked_by uuid references profiles (id) on delete set null,
  linked_at timestamptz not null default now(),
  unique (incident_id, vehicle_id)
);

create index incident_vehicles_incident_id_idx on incident_vehicles (incident_id);
create index incident_vehicles_vehicle_id_idx on incident_vehicles (vehicle_id);

-- New timeline entry type for person/vehicle linkage, same treatment as
-- 'agency' (0035). Added in its own statement — consumed by functions in
-- 0052, a separate migration/transaction, per the Postgres rule that a new
-- enum value can't be used in the transaction that creates it.
alter type incident_log_entry_type add value 'intelligence';
