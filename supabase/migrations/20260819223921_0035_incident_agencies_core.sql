-- Phase 7: External agency liaison. docs/incident-control.md's closure
-- checklist already expects "external agencies recorded if any were
-- involved" and the timeline already has an 'agency' entry_type (0023) —
-- this is the table that was missing. Agency type is free text, same
-- rationale as incident_resources.resource_type: agency naming varies too
-- much by jurisdiction/incident to force into an enum.

create type incident_agency_status as enum ('notified', 'attending', 'on_scene', 'stood_down');

create table incident_agencies (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  reference text not null unique,
  agency_type text not null,
  agency_name text not null,
  contact_name text,
  contact_number text,
  status incident_agency_status not null default 'notified',
  notified_at timestamptz not null default now(),
  attending_at timestamptz,
  arrived_at timestamptz,
  stood_down_at timestamptz,
  notified_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index incident_agencies_incident_id_idx on incident_agencies (incident_id, status);

comment on table incident_agencies is 'External emergency/agency liaison recorded against an incident. Mutated only via notify_incident_agency/update_incident_agency_status — see 0036. Never used to simulate contacting a service — a human always makes that call outside this system.';
