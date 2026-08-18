-- Phase 4: Operational Coordination (spec: actions, decisions, resources,
-- layered on top of the append-only incident_log_entries timeline built
-- in Phase 3). Same guarded-RPC + append-only patterns as incident-control.md.

create type incident_action_status as enum ('open', 'in_progress', 'complete', 'cancelled');

create table incident_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  reference text not null unique,
  description text not null,
  status incident_action_status not null default 'open',
  assigned_to uuid references profiles (id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references profiles (id) on delete set null,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index incident_actions_incident_id_idx on incident_actions (incident_id, status);

comment on table incident_actions is 'Tasked follow-ups against an incident. Mutated only via create_incident_action/complete_incident_action/cancel_incident_action — see 0027.';

-- Decisions are a permanent record of controller judgement calls (spec
-- decision-log requirement) — append-only, same rationale as the timeline
-- itself: no UPDATE/DELETE grant for authenticated, see 0028.
create table incident_decisions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  reference text not null unique,
  decision text not null,
  rationale text,
  decided_by uuid references profiles (id) on delete set null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index incident_decisions_incident_id_idx on incident_decisions (incident_id, decided_at);

comment on table incident_decisions is 'Append-only decision log. No correction path yet — a wrong decision is superseded by a new decision entry, not edited.';

create type incident_resource_status as enum ('requested', 'dispatched', 'on_scene', 'stood_down');

create table incident_resources (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  reference text not null unique,
  resource_type text not null,
  description text,
  status incident_resource_status not null default 'requested',
  requested_at timestamptz not null default now(),
  dispatched_at timestamptz,
  arrived_at timestamptz,
  stood_down_at timestamptz,
  requested_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index incident_resources_incident_id_idx on incident_resources (incident_id, status);

comment on table incident_resources is 'Resources (personnel/vehicles/equipment/agency assets) dispatched against an incident. Status transitions via request_incident_resource/update_incident_resource_status — see 0027.';
