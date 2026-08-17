-- Phase 3: Incident Core (flagship). Configurable categories/priorities
-- (spec §44-45) — organisation-configurable, never hardcoded strings in
-- application logic. Seeded with the spec's starting sets.

create table incident_categories (
  code text primary key,
  name text not null,
  is_system boolean not null default true,
  sort_order int not null default 0
);

insert into incident_categories (code, name, sort_order) values
  ('medical', 'Medical', 1), ('security', 'Security', 2), ('crowd', 'Crowd', 3),
  ('safeguarding', 'Safeguarding', 4), ('missing_child', 'Missing Child', 5),
  ('vulnerable_person', 'Vulnerable Person', 6), ('fire', 'Fire', 7),
  ('weather', 'Weather', 8), ('traffic', 'Traffic', 9), ('transport', 'Transport', 10),
  ('infrastructure', 'Infrastructure', 11), ('utilities', 'Utilities', 12),
  ('communications', 'Communications', 13), ('lost_property', 'Lost Property', 14),
  ('public_disorder', 'Public Disorder', 15), ('suspicious_activity', 'Suspicious Activity', 16),
  ('suspicious_item', 'Suspicious Item', 17), ('contractor', 'Contractor', 18),
  ('accessibility', 'Accessibility', 19), ('welfare', 'Welfare', 20),
  ('noise', 'Noise', 21), ('environmental', 'Environmental', 22),
  ('operational', 'Operational', 23), ('other', 'Other', 24);

-- Priority definitions are organisation-configurable and change-audited
-- (spec §45 — "Every change must be logged"), hence organisation_id +
-- ordinary RLS rather than a fixed enum.
create table incident_priorities (
  code text not null,
  organisation_id uuid not null references organisations (id) on delete cascade,
  name text not null,
  description text not null,
  rank int not null,        -- 1 = most severe
  color_token text not null default 'destructive',
  primary key (organisation_id, code)
);

insert into incident_priorities (code, organisation_id, name, description, rank, color_token)
select defaults.code, o.id, defaults.name, defaults.description, defaults.rank, defaults.color_token
from organisations o, (values
  ('P1', 'Critical', 'Immediate significant threat to life, event-wide safety or major operational continuity.', 1, 'destructive'),
  ('P2', 'Serious', 'Significant incident requiring urgent management intervention.', 2, 'warning'),
  ('P3', 'Moderate', 'Operational issue requiring controlled response.', 3, 'info'),
  ('P4', 'Routine', 'Minor incident or information record.', 4, 'muted')
) as defaults(code, name, description, rank, color_token)
where o.code = 'TEG';

create type incident_status as enum (
  'reported', 'acknowledged', 'active', 'monitoring',
  'awaiting_information', 'external_agency_lead', 'suspended',
  'resolved', 'closed'
);

create type report_source as enum (
  'radio', 'telephone', 'in_person', 'field_app', 'event_control_observation',
  'client', 'contractor', 'emergency_service', 'public', 'system_integration', 'other'
);
