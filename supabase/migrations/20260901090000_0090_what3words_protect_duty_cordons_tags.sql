-- Four features grounded in real UK event-control-room practice and
-- current legislation, researched against comparable products (ECR
-- Manager, Momentus WeTrack) rather than invented:
--   1. what3words location capture (the real convention UK control rooms
--      use for precise, radio-speakable locations, alongside GPS/named
--      location — not a replacement for either).
--   2. Martyn's Law (Terrorism (Protection of Premises) Act 2025) /
--      "Protect Duty" readiness tracking — reuses the existing generic
--      readiness_checklist_items / operation_readiness_checks pair
--      rather than inventing a parallel system; complete_readiness_check
--      / uncomplete_readiness_check (0018-era) already work unchanged.
--   3. Structured cordons and control points (inner/outer cordon,
--      rendezvous point, casualty clearing station) — real LESLP/JESIP
--      multi-agency doctrine, not free-text mentions.
--   4. Free-form event tags, cross-cutting and independent of
--      category/priority.

-- 1. what3words -------------------------------------------------------
alter table events add column what3words text;
comment on column events.what3words is 'What3words address for this event''s location — precise, radio-speakable, independent of the named operational_locations entry.';

alter table methane_message_versions add column what3words text;
comment on column methane_message_versions.what3words is 'What3words for the METHANE "Exact location" field, alongside the free-text description.';

create or replace function create_event(
  p_operation_id uuid,
  p_category_code text,
  p_summary text,
  p_location_id uuid default null,
  p_description text default null,
  p_priority_code text default null,
  p_report_source report_source default 'other',
  p_reported_by_name text default null,
  p_occurred_at timestamptz default now(),
  p_what3words text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation operations%rowtype;
  v_incident_id uuid;
  v_reference text;
begin
  select * into v_operation from operations where id = p_operation_id;
  if v_operation.id is null then
    raise exception 'Operation not found';
  end if;
  if not has_permission('event.create', v_operation.organisation_id, v_operation.client_id, v_operation.id) then
    raise exception 'Not authorised to create events on this operation';
  end if;

  v_reference := next_operation_reference(p_operation_id, 'EVT');

  insert into events (
    organisation_id, operation_id, reference, operation_phase, category_code, priority_code,
    location_id, summary, description, report_source, reported_by_name,
    reported_by_profile_id, occurred_at, created_by, what3words
  ) values (
    v_operation.organisation_id, p_operation_id, v_reference, v_operation.current_phase, p_category_code, p_priority_code,
    p_location_id, p_summary, p_description, p_report_source, p_reported_by_name,
    auth.uid(), p_occurred_at, auth.uid(), p_what3words
  )
  returning id into v_incident_id;

  insert into event_log_entries (event_id, entry_type, body, author_id, occurred_at)
  values (v_incident_id, 'report', p_summary, auth.uid(), p_occurred_at);

  perform record_audit_event('incident', v_incident_id, 'created',
    p_operation_id := p_operation_id,
    p_after_state := jsonb_build_object('reference', v_reference, 'category', p_category_code, 'priority', p_priority_code));

  return v_incident_id;
end;
$$;

create function set_event_what3words(p_event_id uuid, p_what3words text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('event.update', v_event.organisation_id, null, v_event.operation_id) then
    raise exception 'Not authorised to update this event';
  end if;

  update events set what3words = nullif(trim(p_what3words), '') where id = p_event_id;

  perform record_audit_event('incident', p_event_id, 'what3words_updated',
    p_operation_id := v_event.operation_id,
    p_before_state := jsonb_build_object('what3words', v_event.what3words),
    p_after_state := jsonb_build_object('what3words', p_what3words));
end;
$$;

revoke all on function set_event_what3words(uuid, text) from public;
grant execute on function set_event_what3words(uuid, text) to authenticated;

create or replace function create_methane_message(
  p_event_id uuid,
  p_major_incident_declared boolean,
  p_exact_location text,
  p_incident_type text,
  p_hazards text default null,
  p_access_and_egress text default null,
  p_casualties text default null,
  p_emergency_services text default null,
  p_what3words text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_message_id uuid;
  v_reference text;
  v_next_version int;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('event.update', v_event.organisation_id, null, v_event.operation_id) then
    raise exception 'Not authorised to update this event';
  end if;

  select id into v_message_id from methane_messages where event_id = p_event_id;

  if v_message_id is null then
    v_reference := next_operation_reference(v_event.operation_id, 'METHANE');
    insert into methane_messages (event_id, reference, created_by)
    values (p_event_id, v_reference, auth.uid())
    returning id into v_message_id;
    v_next_version := 1;
  else
    select coalesce(max(version_no), 0) + 1 into v_next_version from methane_message_versions where methane_message_id = v_message_id;
  end if;

  insert into methane_message_versions (
    methane_message_id, version_no, major_incident_declared, exact_location, incident_type,
    hazards, access_and_egress, casualties, emergency_services, submitted_by, what3words
  ) values (
    v_message_id, v_next_version, p_major_incident_declared, p_exact_location, p_incident_type,
    p_hazards, p_access_and_egress, p_casualties, p_emergency_services, auth.uid(), p_what3words
  );

  insert into event_log_entries (event_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_event_id, 'update', format('M/ETHANE submitted (version %s)', v_next_version),
    auth.uid(), 'methane_message', v_message_id);

  return v_message_id;
end;
$$;

-- 2. Protect Duty readiness items -------------------------------------
alter table readiness_checklist_items add column category text not null default 'general';
comment on column readiness_checklist_items.category is 'general | protect_duty_standard | protect_duty_enhanced. The protect_duty_* items are Martyn''s Law (Terrorism (Protection of Premises) Act 2025) requirements, surfaced only when the operation''s computed capacity tier calls for them — see listProtectDutyTier in the app.';

insert into readiness_checklist_items (organisation_id, code, name, description, sort_order, category)
select o.id, x.code, x.name, x.description, x.sort_order, x.category
from organisations o, (values
  ('protect_duty_procedures', 'Determine public protection procedures', 'Agreed procedures for what to do if a terrorist attack occurs at this operation — evacuation, invacuation, and lockdown.', 100, 'protect_duty_standard'),
  ('protect_duty_communicate', 'Communicate procedures to staff', 'All staff and contractors briefed on the public protection procedures for this operation.', 101, 'protect_duty_standard'),
  ('protect_duty_document', 'Document the procedures', 'Public protection procedures recorded in writing and available to relevant staff on request.', 102, 'protect_duty_standard'),
  ('protect_duty_risk_assessment', 'Complete a Protect Duty risk assessment', 'A documented assessment of the terrorism risk to this operation, covering the premises, activities, and reasonably foreseeable numbers.', 110, 'protect_duty_enhanced'),
  ('protect_duty_physical_measures', 'Document physical and technological measures', 'Measures such as CCTV, screening, or physical barriers in place, recorded against the risk assessment.', 111, 'protect_duty_enhanced'),
  ('protect_duty_senior_officer', 'Appoint a Designated Senior Officer', 'A named individual responsible for Protect Duty compliance at this operation.', 112, 'protect_duty_enhanced')
) as x(code, name, description, sort_order, category)
where not exists (
  select 1 from readiness_checklist_items existing where existing.organisation_id = o.id and existing.code = x.code
);

-- 3. Cordons & control points -------------------------------------------
create type cordon_type as enum ('inner_cordon', 'outer_cordon', 'rendezvous_point', 'casualty_clearing_station');

create table event_cordons (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  operation_id uuid not null references operations (id) on delete cascade,
  event_id uuid references events (id) on delete set null,
  type cordon_type not null,
  label text not null,
  location_description text,
  what3words text,
  established_at timestamptz not null default now(),
  established_by uuid references profiles (id) on delete set null,
  closed_at timestamptz,
  closed_by uuid references profiles (id) on delete set null,
  notes text
);

comment on table event_cordons is 'Structured control points established during an operation or major incident: inner/outer cordons, rendezvous points, casualty clearing stations. Real LESLP/JESIP multi-agency doctrine — see College of Policing "Command, control and coordination" guidance. Mutated only via establish_cordon/close_cordon.';

create index event_cordons_operation_id_idx on event_cordons (operation_id) where closed_at is null;
create index event_cordons_event_id_idx on event_cordons (event_id) where event_id is not null;

alter table event_cordons enable row level security;

create policy event_cordons_select on event_cordons
  for select using (has_permission('event.view', organisation_id, null, operation_id));

grant select on event_cordons to authenticated;

create function establish_cordon(
  p_operation_id uuid,
  p_type cordon_type,
  p_label text,
  p_event_id uuid default null,
  p_location_description text default null,
  p_what3words text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation operations%rowtype;
  v_cordon_id uuid;
begin
  select * into v_operation from operations where id = p_operation_id;
  if v_operation.id is null then raise exception 'Operation not found'; end if;
  if not has_permission('event.update', v_operation.organisation_id, null, p_operation_id) then
    raise exception 'Not authorised to establish a cordon for this operation';
  end if;
  if trim(coalesce(p_label, '')) = '' then raise exception 'Label is required'; end if;

  insert into event_cordons (organisation_id, operation_id, event_id, type, label, location_description, what3words, established_by, notes)
  values (v_operation.organisation_id, p_operation_id, p_event_id, p_type, p_label, p_location_description, p_what3words, auth.uid(), p_notes)
  returning id into v_cordon_id;

  if p_event_id is not null then
    insert into event_log_entries (event_id, entry_type, body, author_id)
    values (p_event_id, 'update', format('%s established: %s', replace(p_type::text, '_', ' '), p_label), auth.uid());
  end if;

  perform record_audit_event('event_cordon', v_cordon_id, 'established',
    p_organisation_id := v_operation.organisation_id,
    p_operation_id := p_operation_id,
    p_after_state := jsonb_build_object('type', p_type, 'label', p_label));

  return v_cordon_id;
end;
$$;

create function close_cordon(p_cordon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cordon event_cordons%rowtype;
begin
  select * into v_cordon from event_cordons where id = p_cordon_id;
  if v_cordon.id is null then raise exception 'Cordon not found'; end if;
  if not has_permission('event.update', v_cordon.organisation_id, null, v_cordon.operation_id) then
    raise exception 'Not authorised to close this cordon';
  end if;
  if v_cordon.closed_at is not null then raise exception 'This is already closed'; end if;

  update event_cordons set closed_at = now(), closed_by = auth.uid() where id = p_cordon_id;

  perform record_audit_event('event_cordon', p_cordon_id, 'closed',
    p_organisation_id := v_cordon.organisation_id,
    p_operation_id := v_cordon.operation_id);
end;
$$;

revoke all on function establish_cordon(uuid, cordon_type, text, uuid, text, text, text) from public;
revoke all on function close_cordon(uuid) from public;
grant execute on function establish_cordon(uuid, cordon_type, text, uuid, text, text, text) to authenticated;
grant execute on function close_cordon(uuid) to authenticated;

-- 4. Event tags ---------------------------------------------------------
create table event_tags (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  tag text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, tag)
);

comment on table event_tags is 'Free-form cross-cutting tags on an event, independent of category/priority — e.g. "VIP", "media interest", "repeat location". Mutated only via add_event_tag/remove_event_tag.';

create index event_tags_event_id_idx on event_tags (event_id);

alter table event_tags enable row level security;

create policy event_tags_select on event_tags
  for select using (
    exists (
      select 1 from events e
      where e.id = event_tags.event_id and has_permission('event.view', e.organisation_id, null, e.operation_id)
    )
  );

grant select on event_tags to authenticated;

create function add_event_tag(p_event_id uuid, p_tag text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_tag_id uuid;
  v_clean text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('event.update', v_event.organisation_id, null, v_event.operation_id) then
    raise exception 'Not authorised to update this event';
  end if;

  v_clean := trim(lower(p_tag));
  if v_clean = '' then raise exception 'Tag cannot be empty'; end if;
  if length(v_clean) > 40 then raise exception 'Tag is too long (40 characters max)'; end if;

  insert into event_tags (event_id, tag, created_by)
  values (p_event_id, v_clean, auth.uid())
  on conflict (event_id, tag) do nothing
  returning id into v_tag_id;

  if v_tag_id is null then
    select id into v_tag_id from event_tags where event_id = p_event_id and tag = v_clean;
  end if;

  return v_tag_id;
end;
$$;

create function remove_event_tag(p_tag_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tag event_tags%rowtype;
  v_event events%rowtype;
begin
  select * into v_tag from event_tags where id = p_tag_id;
  if v_tag.id is null then raise exception 'Tag not found'; end if;
  select * into v_event from events where id = v_tag.event_id;
  if not has_permission('event.update', v_event.organisation_id, null, v_event.operation_id) then
    raise exception 'Not authorised to update this event';
  end if;

  delete from event_tags where id = p_tag_id;
end;
$$;

revoke all on function add_event_tag(uuid, text) from public;
revoke all on function remove_event_tag(uuid) from public;
grant execute on function add_event_tag(uuid, text) to authenticated;
grant execute on function remove_event_tag(uuid) to authenticated;

-- create_event and create_methane_message gained a new trailing
-- parameter above via CREATE OR REPLACE — Postgres resolves functions by
-- full signature, so that actually created a second overload alongside
-- the original rather than replacing it, on any database where the
-- original (pre-what3words) signature already exists. Two live overloads
-- is both an ambiguous-overload risk for PostgREST's RPC resolution and
-- a security gap, since the new overload starts with a fresh default
-- PUBLIC execute grant rather than inheriting the original's
-- authenticated-only restriction. Drop the superseded signatures
-- explicitly (a fresh database never creates them, so this is a no-op
-- there) and restate the grants on the current signature.
drop function if exists create_event(uuid, text, text, uuid, text, text, report_source, text, timestamptz);
drop function if exists create_methane_message(uuid, boolean, text, text, text, text, text, text);

revoke all on function create_event(uuid, text, text, uuid, text, text, report_source, text, timestamptz, text) from public, anon;
grant execute on function create_event(uuid, text, text, uuid, text, text, report_source, text, timestamptz, text) to authenticated;

revoke all on function create_methane_message(uuid, boolean, text, text, text, text, text, text, text) from public, anon;
grant execute on function create_methane_message(uuid, boolean, text, text, text, text, text, text, text) to authenticated;
