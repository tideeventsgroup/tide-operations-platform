-- Risk register. Category is free text (same rationale as
-- incident_resources.resource_type — orgs categorise risks differently).
-- risk_score is a generated column so the sort order/severity displayed
-- can never drift from the two inputs that produced it.

create type risk_status as enum ('open', 'mitigated', 'accepted', 'closed');

create table risks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  event_id uuid not null references events (id) on delete restrict,
  reference text not null unique,
  title text not null,
  description text,
  category text,
  likelihood smallint not null check (likelihood between 1 and 5),
  impact smallint not null check (impact between 1 and 5),
  risk_score smallint generated always as (likelihood * impact) stored,
  status risk_status not null default 'open',
  mitigation text,
  owner_id uuid references profiles (id) on delete set null,
  closed_at timestamptz,
  closed_by uuid references profiles (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index risks_event_id_idx on risks (event_id, status);
create index risks_event_score_idx on risks (event_id, risk_score desc);

comment on table risks is 'Event risk register. Status/mitigation changes go through update_risk() — see 0045.';

create trigger risks_reference_immutable
  before update on risks
  for each row execute function prevent_reference_update();

-- Readiness checklist: an org-configurable catalogue of gate items
-- (mirrors document_types/incident_categories), instantiated per event as
-- completion rows.
create table readiness_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  unique (organisation_id, code)
);

comment on table readiness_checklist_items is 'Configurable readiness gate catalogue, per organisation.';

create table event_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  checklist_item_id uuid not null references readiness_checklist_items (id) on delete restrict,
  completed boolean not null default false,
  completed_by uuid references profiles (id) on delete set null,
  completed_at timestamptz,
  notes text,
  unique (event_id, checklist_item_id)
);

create index event_readiness_checks_event_id_idx on event_readiness_checks (event_id);

comment on table event_readiness_checks is 'Per-event instance of the readiness checklist. A row only exists once an item has been touched — absence means not yet started, not incomplete-by-error.';
