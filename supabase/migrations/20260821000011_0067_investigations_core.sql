-- Investigations: a case wrapper that groups incidents, people, vehicles,
-- and evidence together — the "connect the dots" layer the vision doc
-- describes. Deliberately organisation-scoped, not event-scoped: a case
-- (a repeat banned individual, a pattern of thefts) can span multiple
-- events by design, so investigation.view/manage (0069) are meant to be
-- held as org-wide grants, unlike the event-scoped intelligence/evidence
-- permissions.

create type investigation_status as enum ('open', 'active', 'closed', 'archived');

create table investigations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  reference text not null unique,
  title text not null,
  summary text,
  classification classification_level not null default 'restricted',
  status investigation_status not null default 'open',
  lead_investigator_id uuid references profiles (id) on delete set null,
  opened_by uuid references profiles (id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_reason text,
  created_at timestamptz not null default now()
);

comment on table investigations is 'Case wrapper linking incidents/people/vehicles/evidence. Mutated only via the guarded functions in 0068.';

create index investigations_organisation_id_idx on investigations (organisation_id, status);

create table investigation_incidents (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references investigations (id) on delete cascade,
  incident_id uuid not null references incidents (id) on delete restrict,
  linked_by uuid references profiles (id) on delete set null,
  linked_at timestamptz not null default now(),
  unique (investigation_id, incident_id)
);

create table investigation_people (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references investigations (id) on delete cascade,
  person_id uuid not null references people (id) on delete restrict,
  role_code text not null,
  notes text,
  linked_by uuid references profiles (id) on delete set null,
  linked_at timestamptz not null default now(),
  unique (investigation_id, person_id)
);

create table investigation_vehicles (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references investigations (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id) on delete restrict,
  role_code text not null,
  notes text,
  linked_by uuid references profiles (id) on delete set null,
  linked_at timestamptz not null default now(),
  unique (investigation_id, vehicle_id)
);

create table investigation_evidence (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references investigations (id) on delete cascade,
  evidence_item_id uuid not null references evidence_items (id) on delete restrict,
  linked_by uuid references profiles (id) on delete set null,
  linked_at timestamptz not null default now(),
  unique (investigation_id, evidence_item_id)
);

-- Append-only investigator narrative, same pattern as incident_log_entries.
create table investigation_notes (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references investigations (id) on delete cascade,
  body text not null,
  author_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index investigation_notes_investigation_id_idx on investigation_notes (investigation_id, created_at);
