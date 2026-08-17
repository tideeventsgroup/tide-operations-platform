-- Phase 2: Events — the central operational container (spec §28-34).

create type event_lifecycle_stage as enum (
  'enquiry', 'proposal', 'confirmed', 'planning', 'documentation',
  'client_review', 'readiness_review', 'operational_ready', 'live',
  'stand_down', 'post_event_review', 'closed', 'archived'
);

create type event_phase as enum (
  'build', 'pre_open', 'ingress', 'live', 'peak', 'egress',
  'closed_to_public', 'breakdown', 'stand_down'
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  client_id uuid not null references clients (id) on delete restrict,
  reference text not null unique,
  name text not null,
  year int not null,
  category text,
  description text,
  lifecycle_stage event_lifecycle_stage not null default 'enquiry',
  current_phase event_phase,                 -- only meaningful while lifecycle_stage = 'live'
  timezone text not null default 'Europe/London',
  local_authority text,
  jurisdiction text not null default 'Scotland',

  -- Core dates (spec §28)
  planning_start_date date,
  build_start_at timestamptz,
  load_in_at timestamptz,
  staff_call_at timestamptz,
  doors_at timestamptz,
  opens_at timestamptz,
  closes_at timestamptz,
  stand_down_at timestamptz,
  breakdown_at timestamptz,
  load_out_at timestamptz,
  start_date date,                            -- multi-day range (spec §28)
  end_date date,

  -- Attendance (spec §30) — kept distinct, never conflated
  licensed_capacity int,
  planned_public_capacity int,
  expected_attendance int,
  expected_peak int,
  actual_peak int,
  staff_count int,
  contractor_count int,
  performer_count int,

  portal_enabled boolean not null default false, -- client portal visibility gate (Phase 10)
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index events_organisation_id_idx on events (organisation_id);
create index events_client_id_idx on events (client_id);
create index events_lifecycle_stage_idx on events (organisation_id, lifecycle_stage);

comment on table events is 'The central operational container. reference is the permanent TEG-EVT-<year>-0001 correspondence ID.';
comment on column events.current_phase is 'Live-operations phase, inherited by incidents at creation time. Only set while lifecycle_stage = live.';

create function set_event_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := next_reference(new.organisation_id, 'EVT', true);
  end if;
  return new;
end;
$$;

create trigger events_set_reference
  before insert on events
  for each row execute function set_event_reference();

create trigger events_reference_immutable
  before update on events
  for each row execute function prevent_reference_update();

revoke execute on function set_event_reference() from public, anon, authenticated;

-- Lifecycle transition history — audited, not just overwritten (spec §32).
create table event_stage_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  from_stage event_lifecycle_stage,
  to_stage event_lifecycle_stage not null,
  changed_by uuid references profiles (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index event_stage_history_event_id_idx on event_stage_history (event_id, created_at desc);

-- Configurable event characteristics (spec §29).
create table characteristic_types (
  code text primary key,
  name text not null
);

insert into characteristic_types (code, name) values
  ('indoor', 'Indoor'), ('outdoor', 'Outdoor'), ('mixed', 'Mixed indoor/outdoor'),
  ('ticketed', 'Ticketed'), ('non_ticketed', 'Non-ticketed'),
  ('controlled_entry', 'Controlled entry'), ('open_access', 'Open access'),
  ('alcohol', 'Alcohol'), ('entertainment', 'Entertainment'),
  ('temporary_structures', 'Temporary structures'), ('children_families', 'Children/families'),
  ('camping', 'Camping'), ('road_activity', 'Road activity'), ('water_activity', 'Water activity'),
  ('pyrotechnics', 'Pyrotechnics'), ('funfair', 'Funfair'), ('food_traders', 'Food traders'),
  ('high_risk_activities', 'High-risk activities'), ('accessibility_requirements', 'Accessibility requirements');

create table event_characteristics (
  event_id uuid not null references events (id) on delete cascade,
  characteristic_code text not null references characteristic_types (code) on delete restrict,
  primary key (event_id, characteristic_code)
);

-- Event management structure roles now that events exists (spec §31) — the
-- generic scoped grant table from Phase 1 gains its event FK.
alter table user_roles add constraint user_roles_event_id_fkey
  foreign key (event_id) references events (id) on delete cascade;
alter table user_roles add constraint user_roles_client_id_fkey
  foreign key (client_id) references clients (id) on delete cascade;

-- Site structure: Event → Site → Zone → Area → Location, modelled as one
-- self-referencing table rather than four (spec §35). Feeds Incident
-- Control location references directly in Phase 3.
create type operational_location_type as enum ('site', 'zone', 'area', 'location');
create type operational_location_status as enum ('normal', 'monitoring', 'congested', 'restricted', 'unavailable', 'closed');

create table operational_locations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  parent_id uuid references operational_locations (id) on delete cascade,
  type operational_location_type not null,
  code text,
  name text not null,
  description text,
  status operational_location_status not null default 'normal',
  status_changed_by uuid references profiles (id) on delete set null,
  status_changed_at timestamptz,
  created_at timestamptz not null default now()
);

create index operational_locations_event_id_idx on operational_locations (event_id);
create index operational_locations_parent_id_idx on operational_locations (parent_id);

comment on table operational_locations is 'Event → Site → Zone → Area → Location hierarchy via parent_id. type is informational, not enforced by depth.';
