begin;

alter table public.incident_timeline_entries
  drop constraint incident_timeline_entries_entry_type_check,
  add constraint incident_timeline_entries_entry_type_check check (
    entry_type in (
      'initial_report', 'status_transition', 'operational_update', 'action_created',
      'action_acknowledged', 'action_completed', 'action_verified', 'decision_recorded',
      'deployment', 'agency_contact', 'outcome'
    )
  );

alter table public.incident_timeline_entries
  drop constraint incident_timeline_entries_source_check,
  add constraint incident_timeline_entries_source_check check (
    source in ('operator', 'field_reporter', 'system', 'radio', 'in_person', 'telephone')
  );

alter table public.incident_audit_events
  drop constraint incident_audit_events_action_check,
  add constraint incident_audit_events_action_check check (
    action in (
      'incident.reported', 'incident.detail_saved', 'incident.edited', 'incident.archived',
      'timeline.entry_added', 'incident.action_created', 'incident.action_acknowledged',
      'incident.action_completed', 'incident.action_verified', 'incident.decision_recorded'
    )
  );

alter table public.command_receipts
  drop constraint command_receipts_command_type_check,
  add constraint command_receipts_command_type_check check (
    command_type in (
      'incident.report_received', 'incident.transition', 'incident.timeline.append',
      'incident.action.create', 'incident.action.acknowledge', 'incident.decision.record'
    )
  );

alter table public.operational_outbox
  drop constraint operational_outbox_topic_check,
  add constraint operational_outbox_topic_check check (
    topic in ('incident.created', 'incident.updated', 'incident.timeline_updated', 'incident.action_updated')
  );

create table public.incident_actions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  operational_note text check (operational_note is null or char_length(operational_note) <= 2000),
  owner_name text not null check (char_length(btrim(owner_name)) between 1 and 160),
  priority text not null check (priority in ('immediate', 'high', 'routine')),
  status text not null default 'assigned' check (status in ('assigned', 'acknowledged', 'completed', 'verified', 'cancelled')),
  assigned_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.internal_users(id) on delete restrict,
  completed_at timestamptz,
  completed_by uuid references public.internal_users(id) on delete restrict,
  verified_at timestamptz,
  verified_by uuid references public.internal_users(id) on delete restrict,
  due_at timestamptz,
  assigned_by uuid not null references public.internal_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incident_actions_event_incident_match unique (id, event_id, incident_id)
);

create table public.incident_action_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  incident_action_id uuid not null references public.incident_actions(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'acknowledged', 'completed', 'verified', 'cancelled')),
  actor_id uuid not null references public.internal_users(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 2000)
);

create table public.incident_decisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  decision text not null check (char_length(btrim(decision)) between 1 and 4000),
  rationale text not null check (char_length(btrim(rationale)) between 1 and 2000),
  information_available text check (information_available is null or char_length(information_available) <= 4000),
  decision_maker text not null check (char_length(btrim(decision_maker)) between 1 and 160),
  decided_at timestamptz not null default now(),
  recorded_by uuid not null references public.internal_users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index incident_actions_open_idx on public.incident_actions (incident_id, status, assigned_at desc)
  where status not in ('verified', 'cancelled');
create index incident_decisions_incident_idx on public.incident_decisions (incident_id, decided_at desc);
create index incident_action_events_action_idx on public.incident_action_events (incident_action_id, occurred_at);

create function public.append_incident_timeline_entry(
  p_actor_id uuid,
  p_event_id uuid,
  p_incident_id uuid,
  p_entry_type text,
  p_source text,
  p_content text,
  p_occurred_at timestamptz,
  p_idempotency_key uuid
)
returns table (timeline_entry_id uuid, sequence_number integer, receipt_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_content text := nullif(btrim(p_content), '');
  v_incident public.incidents%rowtype;
  v_receipt public.command_receipts%rowtype;
  v_entry public.incident_timeline_entries%rowtype;
  v_sequence integer;
  v_fingerprint jsonb;
begin
  if p_actor_id is null or not exists (select 1 from public.internal_users where id = p_actor_id and is_active) then
    raise exception 'A valid active operator is required' using errcode = '42501';
  end if;
  if p_entry_type not in ('operational_update', 'deployment', 'agency_contact', 'outcome') then
    raise exception 'Timeline entry type is not permitted' using errcode = '22023';
  end if;
  if p_source not in ('operator', 'field_reporter', 'radio', 'in_person', 'telephone') then
    raise exception 'Timeline source is not permitted' using errcode = '22023';
  end if;
  if v_content is null or char_length(v_content) > 4000 or p_occurred_at is null or p_idempotency_key is null then
    raise exception 'A complete valid timeline update is required' using errcode = '22023';
  end if;

  select * into v_incident from public.incidents where id = p_incident_id and event_id = p_event_id and archived_at is null for update;
  if not found then raise exception 'Incident is unavailable' using errcode = '42501'; end if;

  v_fingerprint := jsonb_build_object('event_id', p_event_id, 'incident_id', p_incident_id, 'entry_type', p_entry_type, 'source', p_source, 'content', v_content, 'occurred_at', p_occurred_at);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'incident.timeline.append' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'timeline_entry_id')::uuid, (v_receipt.response_payload ->> 'sequence_number')::integer, v_receipt.id, false;
    return;
  end if;

  select coalesce(max(sequence_number), 0) + 1 into v_sequence from public.incident_timeline_entries where incident_id = p_incident_id;
  insert into public.incident_timeline_entries (event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by)
  values (p_event_id, p_incident_id, v_sequence, p_entry_type, p_source, v_content, p_occurred_at, p_actor_id) returning * into v_entry;
  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details)
  values (p_event_id, p_incident_id, 'timeline.entry_added', p_actor_id, jsonb_build_object('timeline_entry_id', v_entry.id, 'entry_type', p_entry_type));
  insert into public.operational_outbox (event_id, incident_id, topic, payload)
  values (p_event_id, p_incident_id, 'incident.timeline_updated', jsonb_build_object('incident_id', p_incident_id, 'timeline_entry_id', v_entry.id));
  insert into public.command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload)
  values (p_event_id, p_actor_id, p_idempotency_key, 'incident.timeline.append', v_fingerprint, p_incident_id, jsonb_build_object('timeline_entry_id', v_entry.id, 'sequence_number', v_sequence)) returning * into v_receipt;
  return query select v_entry.id, v_sequence, v_receipt.id, true;
end;
$$;

create function public.create_incident_action(
  p_actor_id uuid,
  p_event_id uuid,
  p_incident_id uuid,
  p_title text,
  p_owner_name text,
  p_priority text,
  p_operational_note text,
  p_due_at timestamptz,
  p_idempotency_key uuid
)
returns table (incident_action_id uuid, receipt_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_incident public.incidents%rowtype; v_receipt public.command_receipts%rowtype; v_action public.incident_actions%rowtype; v_sequence integer; v_fingerprint jsonb;
  v_title text := nullif(btrim(p_title), ''); v_owner text := nullif(btrim(p_owner_name), ''); v_note text := nullif(btrim(p_operational_note), '');
begin
  if p_actor_id is null or not exists (select 1 from public.internal_users where id = p_actor_id and is_active) then raise exception 'A valid active operator is required' using errcode = '42501'; end if;
  if v_title is null or v_owner is null or char_length(v_title) > 300 or char_length(v_owner) > 160 or coalesce(char_length(v_note), 0) > 2000 or p_priority not in ('immediate', 'high', 'routine') or p_idempotency_key is null then raise exception 'A complete valid incident action is required' using errcode = '22023'; end if;
  select * into v_incident from public.incidents where id = p_incident_id and event_id = p_event_id and archived_at is null for update; if not found then raise exception 'Incident is unavailable' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('event_id', p_event_id, 'incident_id', p_incident_id, 'title', v_title, 'owner_name', v_owner, 'priority', p_priority, 'operational_note', v_note, 'due_at', p_due_at);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then if v_receipt.command_type <> 'incident.action.create' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if; return query select (v_receipt.response_payload ->> 'incident_action_id')::uuid, v_receipt.id, false; return; end if;
  insert into public.incident_actions (event_id, incident_id, title, owner_name, priority, operational_note, due_at, assigned_by) values (p_event_id, p_incident_id, v_title, v_owner, p_priority, v_note, p_due_at, p_actor_id) returning * into v_action;
  insert into public.incident_action_events (event_id, incident_id, incident_action_id, event_type, actor_id, note) values (p_event_id, p_incident_id, v_action.id, 'created', p_actor_id, v_note);
  select coalesce(max(sequence_number), 0) + 1 into v_sequence from public.incident_timeline_entries where incident_id = p_incident_id;
  insert into public.incident_timeline_entries (event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by) values (p_event_id, p_incident_id, v_sequence, 'action_created', 'operator', format('Action assigned: %s. Owner: %s. Priority: %s.', v_title, v_owner, p_priority), now(), p_actor_id);
  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details) values (p_event_id, p_incident_id, 'incident.action_created', p_actor_id, jsonb_build_object('incident_action_id', v_action.id));
  insert into public.operational_outbox (event_id, incident_id, topic, payload) values (p_event_id, p_incident_id, 'incident.action_updated', jsonb_build_object('incident_id', p_incident_id, 'incident_action_id', v_action.id));
  insert into public.command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload) values (p_event_id, p_actor_id, p_idempotency_key, 'incident.action.create', v_fingerprint, p_incident_id, jsonb_build_object('incident_action_id', v_action.id)) returning * into v_receipt;
  return query select v_action.id, v_receipt.id, true;
end;
$$;

create function public.acknowledge_incident_action(
  p_actor_id uuid, p_event_id uuid, p_incident_id uuid, p_incident_action_id uuid, p_idempotency_key uuid
)
returns table (incident_action_id uuid, receipt_id uuid, created boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_action public.incident_actions%rowtype; v_receipt public.command_receipts%rowtype; v_sequence integer; v_fingerprint jsonb;
begin
  if p_actor_id is null or not exists (select 1 from public.internal_users where id = p_actor_id and is_active) then raise exception 'A valid active operator is required' using errcode = '42501'; end if;
  if p_idempotency_key is null then raise exception 'An idempotency key is required' using errcode = '22023'; end if;
  select * into v_action from public.incident_actions where id = p_incident_action_id and event_id = p_event_id and incident_id = p_incident_id for update; if not found then raise exception 'Action is unavailable' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('event_id', p_event_id, 'incident_id', p_incident_id, 'incident_action_id', p_incident_action_id);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0)); select * into v_receipt from public.command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then if v_receipt.command_type <> 'incident.action.acknowledge' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if; return query select (v_receipt.response_payload ->> 'incident_action_id')::uuid, v_receipt.id, false; return; end if;
  if v_action.status <> 'assigned' then raise exception 'Only an assigned action can be acknowledged' using errcode = '22023'; end if;
  update public.incident_actions set status = 'acknowledged', acknowledged_at = now(), acknowledged_by = p_actor_id, updated_at = now() where id = p_incident_action_id;
  insert into public.incident_action_events (event_id, incident_id, incident_action_id, event_type, actor_id) values (p_event_id, p_incident_id, p_incident_action_id, 'acknowledged', p_actor_id);
  select coalesce(max(sequence_number), 0) + 1 into v_sequence from public.incident_timeline_entries where incident_id = p_incident_id;
  insert into public.incident_timeline_entries (event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by) values (p_event_id, p_incident_id, v_sequence, 'action_acknowledged', 'operator', format('Action acknowledged: %s.', v_action.title), now(), p_actor_id);
  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details) values (p_event_id, p_incident_id, 'incident.action_acknowledged', p_actor_id, jsonb_build_object('incident_action_id', p_incident_action_id));
  insert into public.command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload) values (p_event_id, p_actor_id, p_idempotency_key, 'incident.action.acknowledge', v_fingerprint, p_incident_id, jsonb_build_object('incident_action_id', p_incident_action_id)) returning * into v_receipt;
  return query select p_incident_action_id, v_receipt.id, true;
end;
$$;

create function public.record_incident_decision(
  p_actor_id uuid, p_event_id uuid, p_incident_id uuid, p_decision text, p_rationale text, p_information_available text, p_decision_maker text, p_decided_at timestamptz, p_idempotency_key uuid
)
returns table (incident_decision_id uuid, receipt_id uuid, created boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_incident public.incidents%rowtype; v_receipt public.command_receipts%rowtype; v_decision public.incident_decisions%rowtype; v_sequence integer; v_fingerprint jsonb; v_text text := nullif(btrim(p_decision), ''); v_rationale text := nullif(btrim(p_rationale), ''); v_maker text := nullif(btrim(p_decision_maker), ''); v_information text := nullif(btrim(p_information_available), '');
begin
  if p_actor_id is null or not exists (select 1 from public.internal_users where id = p_actor_id and is_active) then raise exception 'A valid active operator is required' using errcode = '42501'; end if;
  if v_text is null or v_rationale is null or v_maker is null or char_length(v_text) > 4000 or char_length(v_rationale) > 2000 or char_length(v_maker) > 160 or coalesce(char_length(v_information), 0) > 4000 or p_decided_at is null or p_idempotency_key is null then raise exception 'A complete valid decision is required' using errcode = '22023'; end if;
  select * into v_incident from public.incidents where id = p_incident_id and event_id = p_event_id and archived_at is null for update; if not found then raise exception 'Incident is unavailable' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('event_id', p_event_id, 'incident_id', p_incident_id, 'decision', v_text, 'rationale', v_rationale, 'information_available', v_information, 'decision_maker', v_maker, 'decided_at', p_decided_at);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0)); select * into v_receipt from public.command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then if v_receipt.command_type <> 'incident.decision.record' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if; return query select (v_receipt.response_payload ->> 'incident_decision_id')::uuid, v_receipt.id, false; return; end if;
  insert into public.incident_decisions (event_id, incident_id, decision, rationale, information_available, decision_maker, decided_at, recorded_by) values (p_event_id, p_incident_id, v_text, v_rationale, v_information, v_maker, p_decided_at, p_actor_id) returning * into v_decision;
  select coalesce(max(sequence_number), 0) + 1 into v_sequence from public.incident_timeline_entries where incident_id = p_incident_id;
  insert into public.incident_timeline_entries (event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by) values (p_event_id, p_incident_id, v_sequence, 'decision_recorded', 'operator', v_text, p_decided_at, p_actor_id);
  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details) values (p_event_id, p_incident_id, 'incident.decision_recorded', p_actor_id, jsonb_build_object('incident_decision_id', v_decision.id));
  insert into public.operational_outbox (event_id, incident_id, topic, payload) values (p_event_id, p_incident_id, 'incident.timeline_updated', jsonb_build_object('incident_id', p_incident_id, 'incident_decision_id', v_decision.id));
  insert into public.command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload) values (p_event_id, p_actor_id, p_idempotency_key, 'incident.decision.record', v_fingerprint, p_incident_id, jsonb_build_object('incident_decision_id', v_decision.id)) returning * into v_receipt;
  return query select v_decision.id, v_receipt.id, true;
end;
$$;

revoke all on table public.incident_actions, public.incident_action_events, public.incident_decisions from public, anon, authenticated;
revoke all on function public.append_incident_timeline_entry(uuid, uuid, uuid, text, text, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.create_incident_action(uuid, uuid, uuid, text, text, text, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.acknowledge_incident_action(uuid, uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_incident_decision(uuid, uuid, uuid, text, text, text, text, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.append_incident_timeline_entry(uuid, uuid, uuid, text, text, text, timestamptz, uuid) to service_role;
grant execute on function public.create_incident_action(uuid, uuid, uuid, text, text, text, text, timestamptz, uuid) to service_role;
grant execute on function public.acknowledge_incident_action(uuid, uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.record_incident_decision(uuid, uuid, uuid, text, text, text, text, timestamptz, uuid) to service_role;

commit;
