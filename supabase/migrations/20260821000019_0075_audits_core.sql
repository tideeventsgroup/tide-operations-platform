-- Audits: recurring scored compliance checklists (Auror's "Audits" module
-- — replacing spreadsheets/manual workflows with a structured, scored
-- system). Distinct from Phase 9's readiness_checklist_items, which is a
-- one-off pre-event go/no-go checklist; this is a repeatable audit a
-- team member can run against a site/event at any time, scored as a
-- percentage.

create type audit_response as enum ('pass', 'fail', 'not_applicable');
create type audit_submission_status as enum ('draft', 'submitted');

create table audit_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index audit_templates_organisation_id_idx on audit_templates (organisation_id, is_active);

-- section is free text grouping (e.g. "Perimeter", "Staff Briefing") for
-- the score-by-section breakdown, same free-text-grouping rationale as
-- incident_agencies.agency_type — sections vary too much per template to
-- force into a lookup table.
create table audit_template_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references audit_templates (id) on delete cascade,
  section text,
  question_text text not null,
  sort_order int not null default 0,
  weight int not null default 1,
  created_at timestamptz not null default now()
);

create index audit_template_questions_template_id_idx on audit_template_questions (template_id, sort_order);

create table audit_submissions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  template_id uuid not null references audit_templates (id) on delete restrict,
  event_id uuid references events (id) on delete set null,
  location_id uuid references operational_locations (id) on delete set null,
  status audit_submission_status not null default 'draft',
  score numeric,
  submitted_by uuid references profiles (id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create index audit_submissions_organisation_id_idx on audit_submissions (organisation_id, status);
create index audit_submissions_template_id_idx on audit_submissions (template_id);

create table audit_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references audit_submissions (id) on delete cascade,
  question_id uuid not null references audit_template_questions (id) on delete restrict,
  response audit_response not null,
  notes text,
  answered_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create index audit_answers_submission_id_idx on audit_answers (submission_id);
