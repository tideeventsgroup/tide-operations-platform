-- Phase 5: Flagship Control (docs/incident-control.md §"Controller / Owner
-- / Resource", §M/ETHANE, §"Major Incident Mode"). Three independent
-- pieces: the on-duty control roster (who can be assigned as a
-- controller for this event, and in what role), the M/ETHANE structured
-- message with full version history, and Major Incident Mode activation.

-- On-duty roster. A person can hold a control role for an event without
-- being the controller of any particular incident yet — this is "who is
-- in the room", not "who owns this incident" (that's incidents.controller_id).
create table event_control_roles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  code text not null,
  name text not null,
  sort_order int not null default 0,
  unique (organisation_id, code)
);

comment on table event_control_roles is 'Configurable control-room role catalogue (Lead Controller, Deputy Controller, Loggist...), per organisation.';

create table event_control_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role_id uuid not null references event_control_roles (id) on delete restrict,
  started_at timestamptz not null default now(),
  started_by uuid references profiles (id) on delete set null,
  ended_at timestamptz,
  ended_by uuid references profiles (id) on delete set null
);

create index event_control_sessions_event_id_idx on event_control_sessions (event_id, ended_at);
-- At most one open (ended_at is null) session per person per event — no
-- double sign-on to the same duty roster.
create unique index event_control_sessions_one_open_per_person
  on event_control_sessions (event_id, profile_id) where ended_at is null;

comment on table event_control_sessions is 'Duty roster: who is signed on to Event Control for this event, in what role, right now. Mutated only via start_control_session/end_control_session — see 0031.';

-- M/ETHANE — never overwritten. Each submission is a new version; the
-- parent methane_messages row just tracks the incident link and sequence.
create table methane_messages (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  reference text not null unique,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table methane_message_versions (
  id uuid primary key default gen_random_uuid(),
  methane_message_id uuid not null references methane_messages (id) on delete cascade,
  version_no int not null,
  major_incident_declared boolean not null default false,
  exact_location text not null,
  incident_type text not null,
  hazards text,
  access_and_egress text,
  casualties text,
  emergency_services text,
  submitted_by uuid references profiles (id) on delete set null,
  submitted_at timestamptz not null default now(),
  unique (methane_message_id, version_no)
);

create index methane_message_versions_message_id_idx on methane_message_versions (methane_message_id, version_no);

comment on table methane_message_versions is 'Append-only. A resubmission is a new version, never an edit — see create_methane_message() in 0031.';

-- Major Incident Mode. A boolean flag on the incident would be mutable
-- history; a dedicated activation record (with an explicit deactivation
-- row, not a delete) preserves who/when/why for both directions.
create table major_incident_activations (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  activated_by uuid references profiles (id) on delete set null,
  activated_at timestamptz not null default now(),
  reason text not null,
  deactivated_by uuid references profiles (id) on delete set null,
  deactivated_at timestamptz
);

create index major_incident_activations_incident_id_idx on major_incident_activations (incident_id);
-- At most one live (deactivated_at is null) activation per incident.
create unique index major_incident_activations_one_active_per_incident
  on major_incident_activations (incident_id) where deactivated_at is null;

comment on table major_incident_activations is 'Major Incident Mode activation record. Never simulates emergency service dispatch — see docs/incident-control.md.';
