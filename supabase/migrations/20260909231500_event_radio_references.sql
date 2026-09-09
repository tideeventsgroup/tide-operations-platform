begin;

alter table public.clients add column registration_reference text;
alter table public.events add column document_reference_prefix text;

create table public.event_zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9 _-]{0,39}$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  capacity integer not null check (capacity >= 0),
  use_type text not null check (use_type in ('standard_occupancy', 'evacuation_exit_only')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (event_id, code),
  unique (event_id, id)
);

create table public.event_radio_channels (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  channel_number smallint not null check (channel_number between 1 and 99),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  purpose text not null check (char_length(btrim(purpose)) between 1 and 240),
  silent_net boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, channel_number),
  unique (event_id, id)
);

create table public.event_command_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  callsign text not null check (char_length(btrim(callsign)) between 1 and 80),
  person_name text not null check (char_length(btrim(person_name)) between 1 and 160),
  role_title text not null check (char_length(btrim(role_title)) between 1 and 160),
  internal_user_id uuid references public.internal_users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, callsign)
);

create table public.event_operational_profiles (
  event_id uuid primary key references public.events (id) on delete cascade,
  declared_concurrent_capacity integer check (declared_concurrent_capacity >= 0),
  daily_ticket_cap integer check (daily_ticket_cap >= 0),
  egress_clearance_target_minutes numeric(5,2) check (egress_clearance_target_minutes > 0),
  combined_exit_width_metres numeric(6,2) check (combined_exit_width_metres > 0),
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  control_room_location text check (control_room_location is null or char_length(control_room_location) <= 160),
  control_room_width_metres numeric(5,2) check (control_room_width_metres > 0),
  control_room_depth_metres numeric(5,2) check (control_room_depth_metres > 0),
  cctv_deployed boolean,
  nearest_ae text check (nearest_ae is null or char_length(nearest_ae) <= 160),
  threat_level text check (threat_level in ('low', 'moderate', 'substantial', 'severe', 'critical')),
  threat_checked_at date,
  threat_source_url text,
  regulatory_planning_status text check (regulatory_planning_status in ('not_assessed', 'planning_basis', 'in_force')) default 'not_assessed',
  regulatory_notes text check (regulatory_notes is null or char_length(regulatory_notes) <= 2000),
  updated_at timestamptz not null default now()
);

alter table public.radio_issue_records
  add column assigned_zone_id uuid,
  add column assigned_channel_id uuid,
  add constraint radio_issue_records_zone_event_fkey
    foreign key (event_id, assigned_zone_id) references public.event_zones (event_id, id) on delete restrict,
  add constraint radio_issue_records_channel_event_fkey
    foreign key (event_id, assigned_channel_id) references public.event_radio_channels (event_id, id) on delete restrict;

alter table public.event_zones enable row level security;
alter table public.event_radio_channels enable row level security;
alter table public.event_command_assignments enable row level security;
alter table public.event_operational_profiles enable row level security;

revoke all on public.event_zones, public.event_radio_channels, public.event_command_assignments, public.event_operational_profiles from anon, authenticated;
grant select, insert, update, delete on public.event_zones, public.event_radio_channels, public.event_command_assignments, public.event_operational_profiles to service_role;

commit;
