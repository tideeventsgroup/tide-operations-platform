-- Phase 8: Document Studio. A document is metadata + an append-only
-- version history (the actual files live in the 'event-files' Storage
-- bucket, already provisioned but never wired up — see 0040 for its
-- RLS). Approval is a single-gate workflow (draft -> in_review ->
-- approved -> issued), not multi-approver — matches the permission set
-- already seeded in 0006 (document.create/update/approve/issue/administer).

create table document_types (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  unique (organisation_id, code)
);

comment on table document_types is 'Configurable document catalogue (Event Safety Plan, Risk Assessment...), per organisation.';

create type document_status as enum ('draft', 'in_review', 'approved', 'issued', 'superseded', 'archived');

create table documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  event_id uuid not null references events (id) on delete restrict,
  document_type_id uuid not null references document_types (id) on delete restrict,
  reference text not null unique,
  title text not null,
  status document_status not null default 'draft',
  classification classification_level not null default 'internal',
  current_version_id uuid,
  approved_by uuid references profiles (id) on delete set null,
  approved_at timestamptz,
  issued_by uuid references profiles (id) on delete set null,
  issued_at timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index documents_event_id_idx on documents (event_id, status);

comment on table documents is 'Document metadata + workflow state. File content lives in document_versions/Storage — this row is never used to store file bytes.';

create trigger documents_reference_immutable
  before update on documents
  for each row execute function prevent_reference_update();

create table document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  version_no int not null,
  storage_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  notes text,
  uploaded_by uuid references profiles (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  unique (document_id, version_no)
);

create index document_versions_document_id_idx on document_versions (document_id, version_no);

comment on table document_versions is 'Append-only. A re-upload is always a new version, never an overwrite — see register_document_version() in 0039.';

alter table documents add constraint documents_current_version_fkey
  foreign key (current_version_id) references document_versions (id) on delete set null;

create table document_status_history (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  from_status document_status,
  to_status document_status not null,
  reason text,
  changed_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index document_status_history_document_id_idx on document_status_history (document_id, created_at);

comment on table document_status_history is 'Append-only status trail, same pattern as event_stage_history.';
