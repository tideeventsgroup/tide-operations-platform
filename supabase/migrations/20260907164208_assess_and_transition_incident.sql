update public.incidents set status = 'received' where status = 'reported';

alter table public.incidents drop constraint incidents_status_check;
alter table public.incidents add constraint incidents_status_check check (
  status in ('received', 'assessing', 'active', 'monitoring', 'resolved', 'closed', 'reopened')
);

create table public.incident_severity_levels (
  code text primary key check (code in ('low', 'moderate', 'high', 'critical')),
  label text not null check (char_length(label) between 1 and 40),
  rank smallint not null unique check (rank between 1 and 4),
  is_active boolean not null default true
);

insert into public.incident_severity_levels (code, label, rank) values
  ('low', 'Low', 1),
  ('moderate', 'Moderate', 2),
  ('high', 'High', 3),
  ('critical', 'Critical', 4);

create table public.incident_categories (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete restrict,
  code text not null check (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  label text not null check (char_length(label) between 1 and 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, code),
  unique (id, organisation_id)
);

alter table public.incidents
  add column category_id uuid,
  add column owner_profile_id uuid,
  add constraint incidents_category_tenant_fk foreign key (category_id, organisation_id)
    references public.incident_categories (id, organisation_id),
  add constraint incidents_owner_profile_fk foreign key (owner_profile_id)
    references public.profiles (id);

create table public.incident_transitions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  incident_id uuid not null,
  command_receipt_id uuid not null,
  previous_version integer not null check (previous_version >= 1),
  new_version integer not null check (new_version = previous_version + 1),
  previous_status text not null,
  new_status text not null,
  previous_severity text not null,
  new_severity text not null,
  reason text not null check (char_length(reason) between 1 and 1000),
  transitioned_by uuid not null references public.profiles (id),
  occurred_at timestamptz not null default now(),
  constraint incident_transitions_incident_tenant_fk foreign key (incident_id, event_id, organisation_id)
    references public.incidents (id, event_id, organisation_id),
  constraint incident_transitions_receipt_fk foreign key (command_receipt_id)
    references public.command_receipts (id),
  unique (incident_id, new_version),
  unique (command_receipt_id)
);

create index incident_categories_organisation_idx on public.incident_categories (organisation_id, label);
create index incident_transitions_incident_occurred_idx on public.incident_transitions (incident_id, occurred_at desc);

alter table public.incident_severity_levels enable row level security;
alter table public.incident_categories enable row level security;
alter table public.incident_transitions enable row level security;

create policy "severity levels select authenticated" on public.incident_severity_levels
  for select to authenticated using (true);
create policy "incident categories select authorised" on public.incident_categories
  for select to authenticated using (app_private.is_organisation_member(organisation_id));
create policy "incident categories manage admins" on public.incident_categories
  for all to authenticated using (app_private.is_organisation_admin(organisation_id))
  with check (app_private.is_organisation_admin(organisation_id));
create policy "incident transitions select authorised" on public.incident_transitions
  for select to authenticated using (app_private.has_event_capability(event_id, 'incident.read'));

grant select on public.incident_severity_levels to authenticated;
grant select, insert, update on public.incident_categories to authenticated;
grant select on public.incident_transitions to authenticated;

alter table public.incident_timeline_entries drop constraint incident_timeline_entries_entry_type_check;
alter table public.incident_timeline_entries add constraint incident_timeline_entries_entry_type_check check (
  entry_type in ('initial_report', 'status_transition')
);
alter table public.incident_audit_events drop constraint incident_audit_events_action_check;
alter table public.incident_audit_events add constraint incident_audit_events_action_check check (
  action in ('incident.reported', 'incident.transitioned')
);
alter table public.command_receipts drop constraint command_receipts_command_type_check;
alter table public.command_receipts add constraint command_receipts_command_type_check check (
  command_type in ('incident.report_received', 'incident.transition')
);
alter table public.operational_outbox drop constraint operational_outbox_topic_check;
alter table public.operational_outbox add constraint operational_outbox_topic_check check (
  topic in ('incident.created', 'incident.updated')
);

create function public.transition_incident(
  p_incident_id uuid,
  p_expected_version integer,
  p_target_status text,
  p_target_severity text,
  p_reason text,
  p_idempotency_key uuid
)
returns table (incident_id uuid, incident_reference text, version integer, receipt_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_incident public.incidents%rowtype;
  v_receipt public.command_receipts%rowtype;
  v_actor_id uuid := (select auth.uid());
  v_reason text := nullif(btrim(p_reason), '');
  v_status text;
  v_severity text;
  v_previous_status text;
  v_previous_severity text;
  v_fingerprint jsonb;
  v_receipt_id uuid;
  v_timeline_sequence integer;
begin
  if v_actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_incident_id is null or p_expected_version is null or p_idempotency_key is null or v_reason is null then
    raise exception 'Incident, version, reason, and idempotency key are required' using errcode = '22023';
  end if;

  if char_length(v_reason) > 1000 then
    raise exception 'Transition reason exceeds the 1000 character limit' using errcode = '22001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text || p_idempotency_key::text, 0));
  select * into v_receipt
  from public.command_receipts
  where actor_profile_id = v_actor_id and idempotency_key = p_idempotency_key;

  if found then
    v_fingerprint := jsonb_build_object(
      'incident_id', p_incident_id,
      'expected_version', p_expected_version,
      'target_status', p_target_status,
      'target_severity', p_target_severity,
      'reason', v_reason
    );
    if v_receipt.command_type <> 'incident.transition' or v_receipt.request_fingerprint <> v_fingerprint then
      raise exception 'Idempotency key was already used for a different command' using errcode = '23505';
    end if;
    return query select v_receipt.incident_id, v_receipt.response_payload ->> 'incident_reference',
      (v_receipt.response_payload ->> 'version')::integer, v_receipt.id, false;
    return;
  end if;

  select * into v_incident from public.incidents where id = p_incident_id for update;
  if not found or not app_private.has_event_capability(v_incident.event_id, 'incident.manage') then
    raise exception 'Incident transition is not permitted' using errcode = '42501';
  end if;

  if v_incident.version <> p_expected_version then
    raise exception 'Incident has changed since it was opened' using errcode = '40001';
  end if;

  v_status := coalesce(p_target_status, v_incident.status);
  v_severity := coalesce(p_target_severity, v_incident.severity);
  v_previous_status := v_incident.status;
  v_previous_severity := v_incident.severity;
  v_fingerprint := jsonb_build_object(
    'incident_id', p_incident_id,
    'expected_version', p_expected_version,
    'target_status', p_target_status,
    'target_severity', p_target_severity,
    'reason', v_reason
  );

  if v_status = v_incident.status and v_severity = v_incident.severity then
    raise exception 'A transition must change the lifecycle state or severity' using errcode = '22023';
  end if;

  if p_target_severity is not null and not exists (
    select 1 from public.incident_severity_levels where code = p_target_severity and is_active
  ) then
    raise exception 'The requested severity is unavailable' using errcode = '22023';
  end if;

  if p_target_status is not null and not (
    (v_incident.status = 'received' and p_target_status = 'assessing') or
    (v_incident.status = 'assessing' and p_target_status = 'active') or
    (v_incident.status = 'active' and p_target_status = 'monitoring') or
    (v_incident.status = 'monitoring' and p_target_status = 'resolved') or
    (v_incident.status = 'resolved' and p_target_status = 'closed') or
    (v_incident.status = 'closed' and p_target_status = 'reopened') or
    (v_incident.status = 'reopened' and p_target_status = 'active')
  ) then
    raise exception 'The requested lifecycle transition is not allowed' using errcode = '22023';
  end if;

  update public.incidents
  set status = v_status,
      severity = v_severity,
      version = version + 1,
      updated_at = now()
  where id = v_incident.id
  returning * into v_incident;

  insert into public.command_receipts (
    organisation_id, event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload
  ) values (
    v_incident.organisation_id, v_incident.event_id, v_actor_id, p_idempotency_key, 'incident.transition', v_fingerprint,
    v_incident.id, jsonb_build_object('incident_reference', v_incident.display_reference, 'version', v_incident.version)
  ) returning id into v_receipt_id;

  insert into public.incident_transitions (
    organisation_id, event_id, incident_id, command_receipt_id, previous_version, new_version,
    previous_status, new_status, previous_severity, new_severity, reason, transitioned_by
  ) values (
    v_incident.organisation_id, v_incident.event_id, v_incident.id, v_receipt_id, v_incident.version - 1, v_incident.version,
    v_previous_status, v_incident.status, v_previous_severity, v_incident.severity, v_reason, v_actor_id
  );

  select coalesce(max(sequence_number), 0) + 1 into v_timeline_sequence
  from public.incident_timeline_entries where incident_id = v_incident.id;

  insert into public.incident_timeline_entries (
    organisation_id, event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by
  ) values (
    v_incident.organisation_id, v_incident.event_id, v_incident.id, v_timeline_sequence, 'status_transition', 'system', v_reason, now(), v_actor_id
  );

  insert into public.incident_audit_events (organisation_id, event_id, incident_id, action, actor_profile_id, details)
  values (v_incident.organisation_id, v_incident.event_id, v_incident.id, 'incident.transitioned', v_actor_id,
    jsonb_build_object('status', v_incident.status, 'severity', v_incident.severity, 'version', v_incident.version));

  insert into public.operational_outbox (organisation_id, event_id, incident_id, topic, payload)
  values (v_incident.organisation_id, v_incident.event_id, v_incident.id, 'incident.updated',
    jsonb_build_object('incident_id', v_incident.id, 'incident_reference', v_incident.display_reference, 'version', v_incident.version));

  return query select v_incident.id, v_incident.display_reference, v_incident.version, v_receipt_id, true;
end;
$$;

revoke all on function public.transition_incident(uuid, integer, text, text, text, uuid) from public;
grant execute on function public.transition_incident(uuid, integer, text, text, text, uuid) to authenticated;
