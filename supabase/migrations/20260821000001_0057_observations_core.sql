-- Observation reports: lower-friction pre-incident intelligence noting,
-- distinct from a formal Incident (spec's Auror-inspired "observation vs
-- incident" split). A steward can log "large group congregating near gate
-- 3" or "vehicle circling the car park three times" without the overhead
-- of a full incident record. Never auto-escalated — promotion to an
-- incident is always an explicit human decision via
-- promote_observation_to_incident() (0058).

create type observation_status as enum ('open', 'reviewed', 'promoted', 'dismissed');

create table observations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  event_id uuid not null references events (id) on delete restrict,
  reference text not null unique,
  event_phase event_phase,
  -- Free text, same rationale as incident_agencies.agency_type: what gets
  -- observed varies too much to force into an admin-managed lookup table,
  -- and observations are meant to stay quick to log.
  category text not null,
  summary text not null,
  description text,
  location_id uuid references operational_locations (id) on delete set null,
  classification classification_level not null default 'internal',
  status observation_status not null default 'open',
  reported_by_name text,
  reported_by_profile_id uuid references profiles (id) on delete set null,
  occurred_at timestamptz not null default now(),
  reported_at timestamptz not null default now(),
  reviewed_by uuid references profiles (id) on delete set null,
  reviewed_at timestamptz,
  dismissed_reason text,
  promoted_incident_id uuid references incidents (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table observations is 'Lower-friction pre-incident intelligence noting. Mutated only via create_observation/update_observation_status/promote_observation_to_incident — see 0058. Promotion is always an explicit human decision, never automatic.';

create index observations_event_id_idx on observations (event_id, status);
create index observations_created_at_idx on observations (event_id, created_at desc);
