begin;

create table public.incident_reporters (
  incident_id uuid primary key references public.incidents (id) on delete restrict,
  event_id uuid not null references public.events (id) on delete restrict,
  reporter_name text check (reporter_name is null or char_length(btrim(reporter_name)) between 1 and 160),
  reporter_role text check (reporter_role is null or char_length(btrim(reporter_role)) <= 120),
  reporter_organisation text check (reporter_organisation is null or char_length(btrim(reporter_organisation)) <= 160),
  radio_callsign text check (radio_callsign is null or char_length(btrim(radio_callsign)) <= 80),
  contact_number text check (contact_number is null or char_length(btrim(contact_number)) <= 40),
  report_method text check (report_method is null or report_method in ('radio', 'phone', 'in_person', 'cctv', 'app', 'other')),
  entered_by uuid not null references public.internal_users (id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.incident_initial_details (
  incident_id uuid primary key references public.incidents (id) on delete restrict,
  event_id uuid not null references public.events (id) on delete restrict,
  what_happened text check (what_happened is null or char_length(what_happened) <= 4000),
  current_situation text check (current_situation is null or char_length(current_situation) <= 4000),
  people_involved text check (people_involved is null or char_length(people_involved) <= 2000),
  number_involved integer check (number_involved is null or number_involved between 0 and 100000),
  casualties_present boolean not null default false,
  immediate_threat_to_life boolean not null default false,
  incident_ongoing boolean not null default true,
  immediate_hazards text check (immediate_hazards is null or char_length(immediate_hazards) <= 2000),
  person_vehicle_description text check (person_vehicle_description is null or char_length(person_vehicle_description) <= 2000),
  updated_at timestamptz not null default now()
);

create table public.incident_assessments (
  incident_id uuid primary key references public.incidents (id) on delete restrict,
  event_id uuid not null references public.events (id) on delete restrict,
  risk_to_people text check (risk_to_people is null or risk_to_people in ('low', 'medium', 'high', 'critical')),
  escalation_risk text check (escalation_risk is null or escalation_risk in ('low', 'medium', 'high', 'critical')),
  operational_impact text check (operational_impact is null or operational_impact in ('low', 'medium', 'high', 'critical')),
  affected_parties text[] not null default '{}'::text[],
  event_control_command_required boolean not null default false,
  level_rationale text not null check (char_length(btrim(level_rationale)) between 1 and 2000),
  assessed_by uuid not null references public.internal_users (id) on delete restrict,
  assessed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.incident_operational_impacts (
  incident_id uuid primary key references public.incidents (id) on delete restrict,
  event_id uuid not null references public.events (id) on delete restrict,
  affected_area text check (affected_area is null or char_length(affected_area) <= 500),
  service_or_activity_impact text check (service_or_activity_impact is null or char_length(service_or_activity_impact) <= 2000),
  crowd_management_measures text check (crowd_management_measures is null or char_length(crowd_management_measures) <= 2000),
  access_egress_impact text check (access_egress_impact is null or char_length(access_egress_impact) <= 2000),
  communications_impact text check (communications_impact is null or char_length(communications_impact) <= 2000),
  updated_at timestamptz not null default now()
);

create table public.incident_closures (
  incident_id uuid primary key references public.incidents (id) on delete restrict,
  event_id uuid not null references public.events (id) on delete restrict,
  outcome text check (outcome is null or char_length(outcome) <= 4000),
  resolved_at timestamptz,
  closure_rationale text check (closure_rationale is null or char_length(closure_rationale) <= 4000),
  lessons_identified text check (lessons_identified is null or char_length(lessons_identified) <= 4000),
  reviewed_by uuid references public.internal_users (id) on delete restrict,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((reviewed_by is null and reviewed_at is null) or (reviewed_by is not null and reviewed_at is not null))
);

create index incident_reporters_event_idx on public.incident_reporters (event_id);
create index incident_initial_details_event_idx on public.incident_initial_details (event_id);
create index incident_assessments_event_idx on public.incident_assessments (event_id);
create index incident_operational_impacts_event_idx on public.incident_operational_impacts (event_id);
create index incident_closures_event_idx on public.incident_closures (event_id);

alter table public.incident_reporters enable row level security;
alter table public.incident_initial_details enable row level security;
alter table public.incident_assessments enable row level security;
alter table public.incident_operational_impacts enable row level security;
alter table public.incident_closures enable row level security;
revoke all on public.incident_reporters, public.incident_initial_details, public.incident_assessments, public.incident_operational_impacts, public.incident_closures from anon, authenticated;
grant select, insert, update, delete on public.incident_reporters, public.incident_initial_details, public.incident_assessments, public.incident_operational_impacts, public.incident_closures to service_role;

alter table public.incident_audit_events drop constraint if exists incident_audit_events_action_check;
alter table public.incident_audit_events add constraint incident_audit_events_action_check check (action in ('incident.reported', 'incident.detail_saved'));

commit;
