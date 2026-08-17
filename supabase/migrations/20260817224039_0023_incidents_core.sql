-- Event-scoped reference generator: incidents (and later decisions,
-- actions, M/ETHANE) are numbered per-event, not per-organisation, so
-- INC-0001 restarts for every event: TEG-EVT-2026-0001-INC-0047.

create table event_id_counters (
  event_id uuid not null references events (id) on delete cascade,
  entity_type text not null,
  seq bigint not null default 0,
  primary key (event_id, entity_type)
);

comment on table event_id_counters is 'Backing store for next_event_reference(). Never queried directly by application code.';

create function next_event_reference(
  p_event_id uuid,
  p_entity_type text,
  p_suffix_width int default 4
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq bigint;
  v_event_reference text;
begin
  insert into event_id_counters (event_id, entity_type, seq)
  values (p_event_id, p_entity_type, 1)
  on conflict (event_id, entity_type)
  do update set seq = event_id_counters.seq + 1
  returning seq into v_seq;

  select reference into v_event_reference from events where id = p_event_id;

  return format('%s-%s-%s', v_event_reference, p_entity_type, lpad(v_seq::text, p_suffix_width, '0'));
end;
$$;

revoke execute on function next_event_reference(uuid, text, int) from public, anon, authenticated;

-- The incident record itself (spec §47). Deliberately holds only what
-- Event Control needs operationally — restricted welfare/medical detail
-- lives in a separate table (see docs/data-classification.md).
create table incidents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  event_id uuid not null references events (id) on delete restrict,
  reference text not null unique,
  event_phase event_phase,           -- inherited from event.current_phase at creation, never recomputed
  category_code text not null references incident_categories (code) on delete restrict,
  subtype text,
  priority_code text,
  status incident_status not null default 'reported',
  location_id uuid references operational_locations (id) on delete set null,
  summary text not null,
  description text,
  report_source report_source not null default 'other',
  reported_by_name text,             -- free text when the reporter isn't a system user (public, field app pre-auth, etc.)
  reported_by_profile_id uuid references profiles (id) on delete set null,

  occurred_at timestamptz not null default now(),
  reported_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  controller_id uuid references profiles (id) on delete set null,
  owner_id uuid references profiles (id) on delete set null,

  classification classification_level not null default 'internal',
  resolution text,
  resolved_at timestamptz,
  closed_at timestamptz,
  closed_by uuid references profiles (id) on delete set null,
  closure_summary text,

  merged_into_incident_id uuid references incidents (id) on delete set null,

  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),

  foreign key (organisation_id, priority_code) references incident_priorities (organisation_id, code)
);

create index incidents_event_id_idx on incidents (event_id, status);
create index incidents_event_priority_idx on incidents (event_id, priority_code);
create index incidents_created_at_idx on incidents (event_id, created_at desc);

comment on table incidents is 'Operational incident record. Restricted welfare/medical/safeguarding detail lives in incident_sensitive_details / welfare_records, not here — see docs/data-classification.md.';

create trigger incidents_reference_immutable
  before update on incidents
  for each row execute function prevent_reference_update();

-- Append-only timeline (spec §49-50). Ordinary UPDATE/DELETE is not
-- granted to authenticated at all — see 0025 RLS. The only mutation path
-- is append_incident_log_entry() / add_correction().
create type incident_log_entry_type as enum (
  'report', 'update', 'status', 'communication', 'dispatch', 'arrival',
  'action', 'decision', 'agency', 'attachment', 'escalation', 'system', 'correction'
);

create table incident_log_entries (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents (id) on delete cascade,
  entry_type incident_log_entry_type not null,
  body text not null,
  author_id uuid references profiles (id) on delete set null,
  occurred_at timestamptz not null default now(),
  reported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  corrects_entry_id uuid references incident_log_entries (id) on delete set null,
  linked_record_type text,
  linked_record_id uuid
);

create index incident_log_entries_incident_id_idx on incident_log_entries (incident_id, created_at);

comment on table incident_log_entries is 'Append-only. Corrections reference the entry they correct via corrects_entry_id rather than editing it — see docs/incident-control.md.';
