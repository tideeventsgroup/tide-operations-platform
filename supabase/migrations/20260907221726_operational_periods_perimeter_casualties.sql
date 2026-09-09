insert into public.capabilities (id, description) values
  ('period.manage', 'Open and close an Event Control operational period.'),
  ('perimeter.check', 'Record a perimeter check during an open operational period.'),
  ('casualty.manage', 'Record and view restricted casualty coordination records.')
on conflict do nothing;

insert into public.role_capabilities (role, capability_id) values
  ('organisation_admin', 'period.manage'),
  ('organisation_admin', 'perimeter.check'),
  ('organisation_admin', 'casualty.manage'),
  ('event_manager', 'period.manage'),
  ('event_manager', 'perimeter.check'),
  ('event_control_manager', 'period.manage'),
  ('event_control_manager', 'perimeter.check'),
  ('event_control_manager', 'casualty.manage'),
  ('event_control_operator', 'perimeter.check')
on conflict do nothing;

create table public.operational_periods (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  opened_by uuid not null references public.profiles (id),
  opening_note text check (opening_note is null or char_length(opening_note) <= 1000),
  closed_at timestamptz,
  closed_by uuid references public.profiles (id),
  closure_note text,
  incidents_reviewed boolean not null default false,
  actions_reviewed boolean not null default false,
  log_reviewed boolean not null default false,
  perimeter_reviewed boolean not null default false,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  constraint operational_periods_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint operational_periods_close_complete check (
    (status = 'open' and closed_at is null and closed_by is null and closure_note is null)
    or (status = 'closed' and closed_at is not null and closed_by is not null
      and char_length(btrim(closure_note)) between 1 and 1000
      and incidents_reviewed and actions_reviewed and log_reviewed and perimeter_reviewed)
  ),
  unique (id, event_id, organisation_id)
);

create unique index operational_periods_one_open_event_idx
  on public.operational_periods (event_id) where status = 'open';

create table public.perimeter_checks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  operational_period_id uuid not null,
  checkpoint_name text not null check (char_length(btrim(checkpoint_name)) between 1 and 160),
  status text not null check (status in ('secure', 'attention_required', 'not_checked')),
  observation text check (observation is null or char_length(observation) <= 2000),
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles (id),
  constraint perimeter_checks_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint perimeter_checks_period_tenant_fk foreign key (operational_period_id, event_id, organisation_id)
    references public.operational_periods (id, event_id, organisation_id)
);

create table public.casualty_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  incident_id uuid not null,
  casualty_reference text not null check (char_length(btrim(casualty_reference)) between 1 and 40),
  condition_state text not null check (condition_state in (
    'unknown', 'minor', 'requires_medical_assessment', 'emergency_services_requested', 'transferred'
  )),
  care_provider text check (care_provider is null or char_length(care_provider) <= 160),
  handover_status text not null check (handover_status in ('not_required', 'awaiting', 'completed')),
  recording_reason text not null check (char_length(btrim(recording_reason)) between 1 and 500),
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles (id),
  constraint casualty_records_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint casualty_records_incident_tenant_fk foreign key (incident_id, event_id, organisation_id)
    references public.incidents (id, event_id, organisation_id),
  unique (incident_id, casualty_reference)
);

create table public.operational_audit_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  action text not null check (action in (
    'operational_period.opened', 'operational_period.closed', 'perimeter_check.recorded', 'casualty_record.created'
  )),
  actor_profile_id uuid not null references public.profiles (id),
  operational_period_id uuid,
  incident_id uuid,
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  constraint operational_audit_events_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint operational_audit_events_period_tenant_fk foreign key (operational_period_id, event_id, organisation_id)
    references public.operational_periods (id, event_id, organisation_id),
  constraint operational_audit_events_incident_tenant_fk foreign key (incident_id, event_id, organisation_id)
    references public.incidents (id, event_id, organisation_id)
);

create table public.operational_command_receipts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  actor_profile_id uuid not null references public.profiles (id),
  idempotency_key uuid not null,
  command_type text not null check (command_type in ('period.open', 'period.close', 'perimeter.check', 'casualty.create')),
  request_fingerprint jsonb not null,
  response_payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint operational_command_receipts_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  unique (actor_profile_id, idempotency_key)
);

create index perimeter_checks_period_recorded_idx on public.perimeter_checks (operational_period_id, recorded_at desc);
create index casualty_records_incident_recorded_idx on public.casualty_records (incident_id, recorded_at desc);
create index operational_audit_events_event_occurred_idx on public.operational_audit_events (event_id, occurred_at desc);

alter table public.operational_periods enable row level security;
alter table public.perimeter_checks enable row level security;
alter table public.casualty_records enable row level security;
alter table public.operational_audit_events enable row level security;
alter table public.operational_command_receipts enable row level security;

create policy "operational periods select authorised" on public.operational_periods
  for select to authenticated using (app_private.has_event_capability(event_id, 'event.read'));
create policy "perimeter checks select authorised" on public.perimeter_checks
  for select to authenticated using (app_private.has_event_capability(event_id, 'event.read'));
create policy "casualty records select restricted" on public.casualty_records
  for select to authenticated using (app_private.has_event_capability(event_id, 'casualty.manage'));
create policy "operational audit select authorised" on public.operational_audit_events
  for select to authenticated using (app_private.has_event_capability(event_id, 'audit.read'));
create policy "operational command receipts select own" on public.operational_command_receipts
  for select to authenticated using (actor_profile_id = (select auth.uid()));

grant select on public.operational_periods, public.perimeter_checks, public.casualty_records,
  public.operational_audit_events, public.operational_command_receipts to authenticated;

create function public.open_operational_period(
  p_event_id uuid,
  p_opening_note text,
  p_idempotency_key uuid
)
returns table (operational_period_id uuid, version integer, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_period public.operational_periods%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_note text := nullif(btrim(p_opening_note), '');
  v_fingerprint jsonb;
begin
  if v_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_event_id is null or p_idempotency_key is null then raise exception 'Event and idempotency key are required' using errcode = '22023'; end if;
  if v_note is not null and char_length(v_note) > 1000 then raise exception 'Opening note exceeds the 1000 character limit' using errcode = '22001'; end if;
  if not app_private.has_event_capability(p_event_id, 'period.manage') then raise exception 'Operational period management is not permitted' using errcode = '42501'; end if;

  v_fingerprint := jsonb_build_object('event_id', p_event_id, 'opening_note', v_note);
  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = v_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'period.open' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'operational_period_id')::uuid, (v_receipt.response_payload ->> 'version')::integer, false;
    return;
  end if;
  if exists (select 1 from public.operational_periods where event_id = p_event_id and status = 'open') then raise exception 'An operational period is already open for this event' using errcode = '23505'; end if;
  insert into public.operational_periods (organisation_id, event_id, opened_by, opening_note)
  select organisation_id, id, v_actor_id, v_note from public.events where id = p_event_id
  returning * into v_period;
  if not found then raise exception 'Event is unavailable' using errcode = '42501'; end if;
  insert into public.operational_audit_events (organisation_id, event_id, action, actor_profile_id, operational_period_id, details)
    values (v_period.organisation_id, v_period.event_id, 'operational_period.opened', v_actor_id, v_period.id, jsonb_build_object('version', v_period.version));
  insert into public.operational_command_receipts (organisation_id, event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_period.organisation_id, v_period.event_id, v_actor_id, p_idempotency_key, 'period.open', v_fingerprint, jsonb_build_object('operational_period_id', v_period.id, 'version', v_period.version));
  return query select v_period.id, v_period.version, true;
end;
$$;

create function public.close_operational_period(
  p_operational_period_id uuid,
  p_expected_version integer,
  p_closure_note text,
  p_incidents_reviewed boolean,
  p_actions_reviewed boolean,
  p_log_reviewed boolean,
  p_perimeter_reviewed boolean,
  p_idempotency_key uuid
)
returns table (operational_period_id uuid, version integer, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_period public.operational_periods%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_note text := nullif(btrim(p_closure_note), '');
  v_fingerprint jsonb;
begin
  if v_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_operational_period_id is null or p_expected_version is null or p_idempotency_key is null or v_note is null then raise exception 'Period, version, closure note, and idempotency key are required' using errcode = '22023'; end if;
  if char_length(v_note) > 1000 then raise exception 'Closure note exceeds the 1000 character limit' using errcode = '22001'; end if;
  if not coalesce(p_incidents_reviewed, false) or not coalesce(p_actions_reviewed, false) or not coalesce(p_log_reviewed, false) or not coalesce(p_perimeter_reviewed, false) then raise exception 'All closure checks must be confirmed' using errcode = '22023'; end if;
  select * into v_period from public.operational_periods where id = p_operational_period_id for update;
  if not found or not app_private.has_event_capability(v_period.event_id, 'period.manage') then raise exception 'Operational period management is not permitted' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('operational_period_id', p_operational_period_id, 'expected_version', p_expected_version, 'closure_note', v_note, 'incidents_reviewed', p_incidents_reviewed, 'actions_reviewed', p_actions_reviewed, 'log_reviewed', p_log_reviewed, 'perimeter_reviewed', p_perimeter_reviewed);
  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = v_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'period.close' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'operational_period_id')::uuid, (v_receipt.response_payload ->> 'version')::integer, false;
    return;
  end if;
  if v_period.status <> 'open' then raise exception 'This operational period is already closed' using errcode = '23505'; end if;
  if v_period.version <> p_expected_version then raise exception 'This operational period has changed since it was opened' using errcode = '40001'; end if;
  update public.operational_periods set status = 'closed', closed_at = now(), closed_by = v_actor_id, closure_note = v_note,
    incidents_reviewed = true, actions_reviewed = true, log_reviewed = true, perimeter_reviewed = true, version = public.operational_periods.version + 1 where id = v_period.id returning * into v_period;
  insert into public.operational_audit_events (organisation_id, event_id, action, actor_profile_id, operational_period_id, details)
    values (v_period.organisation_id, v_period.event_id, 'operational_period.closed', v_actor_id, v_period.id, jsonb_build_object('version', v_period.version));
  insert into public.operational_command_receipts (organisation_id, event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_period.organisation_id, v_period.event_id, v_actor_id, p_idempotency_key, 'period.close', v_fingerprint, jsonb_build_object('operational_period_id', v_period.id, 'version', v_period.version));
  return query select v_period.id, v_period.version, true;
end;
$$;

create function public.record_perimeter_check(
  p_operational_period_id uuid,
  p_checkpoint_name text,
  p_status text,
  p_observation text,
  p_idempotency_key uuid
)
returns table (perimeter_check_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_period public.operational_periods%rowtype;
  v_check public.perimeter_checks%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_checkpoint text := nullif(btrim(p_checkpoint_name), '');
  v_observation text := nullif(btrim(p_observation), '');
  v_fingerprint jsonb;
begin
  if v_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_operational_period_id is null or p_idempotency_key is null or v_checkpoint is null or p_status not in ('secure', 'attention_required', 'not_checked') then raise exception 'Period, checkpoint, status, and idempotency key are required' using errcode = '22023'; end if;
  if char_length(v_checkpoint) > 160 or (v_observation is not null and char_length(v_observation) > 2000) then raise exception 'Perimeter check exceeds a field limit' using errcode = '22001'; end if;
  select * into v_period from public.operational_periods where id = p_operational_period_id for share;
  if not found or v_period.status <> 'open' or not app_private.has_event_capability(v_period.event_id, 'perimeter.check') then raise exception 'Perimeter checks are not permitted for this operational period' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('operational_period_id', p_operational_period_id, 'checkpoint_name', v_checkpoint, 'status', p_status, 'observation', v_observation);
  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = v_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'perimeter.check' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'perimeter_check_id')::uuid, false;
    return;
  end if;
  insert into public.perimeter_checks (organisation_id, event_id, operational_period_id, checkpoint_name, status, observation, recorded_by)
    values (v_period.organisation_id, v_period.event_id, v_period.id, v_checkpoint, p_status, v_observation, v_actor_id) returning * into v_check;
  insert into public.operational_audit_events (organisation_id, event_id, action, actor_profile_id, operational_period_id, details)
    values (v_period.organisation_id, v_period.event_id, 'perimeter_check.recorded', v_actor_id, v_period.id, jsonb_build_object('perimeter_check_id', v_check.id, 'status', v_check.status));
  insert into public.operational_command_receipts (organisation_id, event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_period.organisation_id, v_period.event_id, v_actor_id, p_idempotency_key, 'perimeter.check', v_fingerprint, jsonb_build_object('perimeter_check_id', v_check.id));
  return query select v_check.id, true;
end;
$$;

create function public.create_casualty_record(
  p_incident_id uuid,
  p_casualty_reference text,
  p_condition_state text,
  p_care_provider text,
  p_handover_status text,
  p_recording_reason text,
  p_idempotency_key uuid
)
returns table (casualty_record_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_incident public.incidents%rowtype;
  v_casualty public.casualty_records%rowtype;
  v_receipt public.operational_command_receipts%rowtype;
  v_reference text := nullif(btrim(p_casualty_reference), '');
  v_provider text := nullif(btrim(p_care_provider), '');
  v_reason text := nullif(btrim(p_recording_reason), '');
  v_fingerprint jsonb;
begin
  if v_actor_id is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if p_incident_id is null or p_idempotency_key is null or v_reference is null or v_reason is null or p_condition_state not in ('unknown', 'minor', 'requires_medical_assessment', 'emergency_services_requested', 'transferred') or p_handover_status not in ('not_required', 'awaiting', 'completed') then raise exception 'Incident, anonymous reference, operational state, handover status, recording reason, and idempotency key are required' using errcode = '22023'; end if;
  if char_length(v_reference) > 40 or char_length(v_reason) > 500 or (v_provider is not null and char_length(v_provider) > 160) then raise exception 'Casualty record exceeds a field limit' using errcode = '22001'; end if;
  select * into v_incident from public.incidents where id = p_incident_id for share;
  if not found or not app_private.has_event_capability(v_incident.event_id, 'casualty.manage') then raise exception 'Restricted casualty record access is not permitted' using errcode = '42501'; end if;
  v_fingerprint := jsonb_build_object('incident_id', p_incident_id, 'casualty_reference', v_reference, 'condition_state', p_condition_state, 'care_provider', v_provider, 'handover_status', p_handover_status, 'recording_reason', v_reason);
  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt from public.operational_command_receipts where actor_profile_id = v_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'casualty.create' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select (v_receipt.response_payload ->> 'casualty_record_id')::uuid, false;
    return;
  end if;
  insert into public.casualty_records (organisation_id, event_id, incident_id, casualty_reference, condition_state, care_provider, handover_status, recording_reason, recorded_by)
    values (v_incident.organisation_id, v_incident.event_id, v_incident.id, v_reference, p_condition_state, v_provider, p_handover_status, v_reason, v_actor_id) returning * into v_casualty;
  insert into public.operational_audit_events (organisation_id, event_id, action, actor_profile_id, incident_id, details)
    values (v_incident.organisation_id, v_incident.event_id, 'casualty_record.created', v_actor_id, v_incident.id, jsonb_build_object('casualty_record_id', v_casualty.id));
  insert into public.operational_command_receipts (organisation_id, event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, response_payload)
    values (v_incident.organisation_id, v_incident.event_id, v_actor_id, p_idempotency_key, 'casualty.create', v_fingerprint, jsonb_build_object('casualty_record_id', v_casualty.id));
  return query select v_casualty.id, true;
end;
$$;

revoke all on function public.open_operational_period(uuid, text, uuid),
  public.close_operational_period(uuid, integer, text, boolean, boolean, boolean, boolean, uuid),
  public.record_perimeter_check(uuid, text, text, text, uuid),
  public.create_casualty_record(uuid, text, text, text, text, text, uuid) from public, anon;
grant execute on function public.open_operational_period(uuid, text, uuid),
  public.close_operational_period(uuid, integer, text, boolean, boolean, boolean, boolean, uuid),
  public.record_perimeter_check(uuid, text, text, text, uuid),
  public.create_casualty_record(uuid, text, text, text, text, text, uuid) to authenticated;
