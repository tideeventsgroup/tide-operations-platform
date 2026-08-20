-- Evidence Locker: chain-of-custody tracking for items linked to an
-- incident. File-based evidence gets a SHA-256 hash recorded at upload
-- (computed client-side/server-side before the register call — the hash
-- itself is just stored here, not computed by the database); non-file
-- evidence (seized physical items, a verbal description of something no
-- longer available) can be logged with no storage_path at all.
--
-- Every access — not just status changes — is meant to append to
-- evidence_custody_log, including views/downloads (see record_evidence_
-- access in 0064). That's what makes this different from the general
-- "RLS is the only access record" pattern used elsewhere in the app: for
-- evidence specifically, the docs/data-classification.md "logged access"
-- requirement for restricted data is enforced by actually writing a log
-- row on every read, not just relying on RLS as the sole boundary.

create type evidence_status as enum ('logged', 'reviewed', 'released', 'disposed');

create table evidence_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  incident_id uuid not null references incidents (id) on delete restrict,
  reference text not null unique,
  item_type text not null,
  description text not null,
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  sha256_hash text,
  classification classification_level not null default 'confidential',
  status evidence_status not null default 'logged',
  collected_by_name text,
  collected_at timestamptz not null default now(),
  logged_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table evidence_items is 'Chain-of-custody evidence linked to an incident. Mutated only via log_evidence_item/update_evidence_status — see 0064. storage_path is null for non-file evidence (physical items, verbal description).';

create index evidence_items_incident_id_idx on evidence_items (incident_id);

create table evidence_custody_log (
  id uuid primary key default gen_random_uuid(),
  evidence_item_id uuid not null references evidence_items (id) on delete cascade,
  action text not null,
  actor_id uuid references profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

comment on table evidence_custody_log is 'Append-only chain-of-custody trail — logged, viewed, downloaded, status_changed. Written by log_evidence_item/record_evidence_access/update_evidence_status (0064), never edited or deleted.';

create index evidence_custody_log_item_id_idx on evidence_custody_log (evidence_item_id, created_at);

-- Own bucket (not 'event-files'): evidence carries chain-of-custody and a
-- tighter default classification than general documents, and a dedicated
-- bucket keeps its storage policies independently auditable rather than
-- interleaved with Document Studio's.
insert into storage.buckets (id, name, public) values ('evidence-files', 'evidence-files', false);
