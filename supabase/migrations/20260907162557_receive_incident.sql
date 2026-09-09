create table public.event_locations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  name text not null check (char_length(name) between 1 and 160),
  location_type text not null default 'named_area' check (location_type in ('named_area', 'zone', 'access_point', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_locations_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  unique (id, event_id)
);

create table public.incident_reference_sequences (
  event_id uuid primary key,
  organisation_id uuid not null,
  last_number integer not null default 0 check (last_number >= 0),
  constraint incident_reference_sequences_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id)
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  display_reference text not null unique check (display_reference ~ '^INC-[A-Z0-9-]+$'),
  status text not null default 'reported' check (status = 'reported'),
  severity text not null default 'unknown' check (severity = 'unknown'),
  location_id uuid,
  initial_report text check (initial_report is null or char_length(initial_report) <= 4000),
  reported_at timestamptz not null,
  created_by uuid not null references public.profiles (id),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incidents_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint incidents_location_event_fk foreign key (location_id, event_id)
    references public.event_locations (id, event_id),
  unique (id, event_id, organisation_id)
);

create table public.incident_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  incident_id uuid not null,
  sequence_number integer not null check (sequence_number > 0),
  entry_type text not null check (entry_type in ('initial_report')),
  source text not null check (source in ('operator', 'field_reporter', 'system')),
  content text check (content is null or char_length(content) <= 4000),
  occurred_at timestamptz not null,
  authored_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint incident_timeline_entries_incident_tenant_fk foreign key (incident_id, event_id, organisation_id)
    references public.incidents (id, event_id, organisation_id),
  unique (incident_id, sequence_number)
);

create table public.incident_audit_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  incident_id uuid not null,
  action text not null check (action in ('incident.reported')),
  actor_profile_id uuid references public.profiles (id),
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  constraint incident_audit_events_incident_tenant_fk foreign key (incident_id, event_id, organisation_id)
    references public.incidents (id, event_id, organisation_id)
);

create table public.command_receipts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  actor_profile_id uuid not null references public.profiles (id),
  idempotency_key uuid not null,
  command_type text not null check (command_type = 'incident.report_received'),
  request_fingerprint jsonb not null,
  incident_id uuid not null,
  response_payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint command_receipts_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint command_receipts_incident_tenant_fk foreign key (incident_id, event_id, organisation_id)
    references public.incidents (id, event_id, organisation_id),
  unique (actor_profile_id, idempotency_key)
);

create table public.operational_outbox (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  event_id uuid not null,
  incident_id uuid,
  topic text not null check (topic = 'incident.created'),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  constraint operational_outbox_event_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint operational_outbox_incident_tenant_fk foreign key (incident_id, event_id, organisation_id)
    references public.incidents (id, event_id, organisation_id)
);

create index event_locations_event_idx on public.event_locations (event_id, name);
create index incidents_event_reported_idx on public.incidents (event_id, reported_at desc);
create index incident_timeline_entries_incident_sequence_idx on public.incident_timeline_entries (incident_id, sequence_number);
create index incident_audit_events_incident_occurred_idx on public.incident_audit_events (incident_id, occurred_at desc);
create index command_receipts_event_actor_idx on public.command_receipts (event_id, actor_profile_id, created_at desc);
create index operational_outbox_unpublished_idx on public.operational_outbox (created_at) where published_at is null;

create function app_private.has_event_capability(target_event_id uuid, required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select app_private.can_access_event(target_event_id)
    and exists (
      select 1
      from public.events event
      join public.organisation_memberships membership
        on membership.organisation_id = event.organisation_id
       and membership.profile_id = (select auth.uid())
      join public.role_capabilities role_capability
        on role_capability.role = membership.role
       and role_capability.capability_id = required_capability
      where event.id = target_event_id
    )
    and (
      exists (
        select 1
        from public.event_access access
        where access.event_id = target_event_id
          and access.profile_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.events event
        where event.id = target_event_id
          and app_private.is_organisation_admin(event.organisation_id)
      )
    );
$$;

revoke all on function app_private.has_event_capability(uuid, text) from public;
grant execute on function app_private.has_event_capability(uuid, text) to authenticated;

alter table public.event_locations enable row level security;
alter table public.incident_reference_sequences enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_timeline_entries enable row level security;
alter table public.incident_audit_events enable row level security;
alter table public.command_receipts enable row level security;
alter table public.operational_outbox enable row level security;

create policy "event locations select authorised" on public.event_locations
  for select to authenticated using (app_private.can_access_event(event_id));
create policy "event locations manage admins" on public.event_locations
  for all to authenticated using (app_private.is_organisation_admin(organisation_id))
  with check (app_private.is_organisation_admin(organisation_id));

create policy "incidents select authorised" on public.incidents
  for select to authenticated using (app_private.has_event_capability(event_id, 'incident.read'));
create policy "incident timelines select authorised" on public.incident_timeline_entries
  for select to authenticated using (app_private.has_event_capability(event_id, 'incident.read'));
create policy "incident audit select authorised" on public.incident_audit_events
  for select to authenticated using (app_private.has_event_capability(event_id, 'audit.read'));
create policy "command receipts select own" on public.command_receipts
  for select to authenticated using (actor_profile_id = (select auth.uid()));

grant select, insert, update on public.event_locations to authenticated;
grant select on public.incidents to authenticated;
grant select on public.incident_timeline_entries to authenticated;
grant select on public.incident_audit_events to authenticated;
grant select on public.command_receipts to authenticated;

create function public.create_incident_report(
  p_event_id uuid,
  p_initial_report text,
  p_occurred_at timestamptz,
  p_idempotency_key uuid
)
returns table (incident_id uuid, incident_reference text, receipt_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.events%rowtype;
  v_incident public.incidents%rowtype;
  v_receipt public.command_receipts%rowtype;
  v_actor_id uuid := (select auth.uid());
  v_report text := nullif(btrim(p_initial_report), '');
  v_fingerprint jsonb;
  v_sequence integer;
begin
  if v_actor_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_event_id is null or p_occurred_at is null or p_idempotency_key is null then
    raise exception 'Event, occurrence time, and idempotency key are required' using errcode = '22023';
  end if;

  if v_report is not null and char_length(v_report) > 4000 then
    raise exception 'Initial report exceeds the 4000 character limit' using errcode = '22001';
  end if;

  if not app_private.has_event_capability(p_event_id, 'incident.create') then
    raise exception 'Incident creation is not permitted for this event' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'Event is unavailable' using errcode = '42501';
  end if;

  v_fingerprint := jsonb_build_object(
    'event_id', p_event_id,
    'initial_report', v_report,
    'occurred_at', p_occurred_at
  );

  perform pg_advisory_xact_lock(hashtextextended(v_actor_id::text || p_idempotency_key::text, 0));

  select * into v_receipt
  from public.command_receipts
  where actor_profile_id = v_actor_id and idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.command_type <> 'incident.report_received' or v_receipt.request_fingerprint <> v_fingerprint then
      raise exception 'Idempotency key was already used for a different command' using errcode = '23505';
    end if;

    return query select v_receipt.incident_id, v_receipt.response_payload ->> 'incident_reference', v_receipt.id, false;
    return;
  end if;

  insert into public.incident_reference_sequences (event_id, organisation_id, last_number)
  values (v_event.id, v_event.organisation_id, 1)
  on conflict (event_id) do update set last_number = public.incident_reference_sequences.last_number + 1
  returning last_number into v_sequence;

  insert into public.incidents (
    organisation_id, event_id, display_reference, initial_report, reported_at, created_by
  ) values (
    v_event.organisation_id,
    v_event.id,
    format('INC-%s-%s', replace(v_event.display_reference, 'EVT-', ''), lpad(v_sequence::text, 4, '0')),
    v_report,
    p_occurred_at,
    v_actor_id
  ) returning * into v_incident;

  insert into public.incident_timeline_entries (
    organisation_id, event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by
  ) values (
    v_incident.organisation_id, v_incident.event_id, v_incident.id, 1, 'initial_report', 'operator',
    v_incident.initial_report, v_incident.reported_at, v_actor_id
  );

  insert into public.incident_audit_events (
    organisation_id, event_id, incident_id, action, actor_profile_id, details
  ) values (
    v_incident.organisation_id, v_incident.event_id, v_incident.id, 'incident.reported', v_actor_id,
    jsonb_build_object('display_reference', v_incident.display_reference)
  );

  insert into public.operational_outbox (organisation_id, event_id, incident_id, topic, payload)
  values (
    v_incident.organisation_id, v_incident.event_id, v_incident.id, 'incident.created',
    jsonb_build_object('incident_id', v_incident.id, 'incident_reference', v_incident.display_reference)
  );

  insert into public.command_receipts (
    organisation_id, event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload
  ) values (
    v_incident.organisation_id, v_incident.event_id, v_actor_id, p_idempotency_key, 'incident.report_received',
    v_fingerprint, v_incident.id, jsonb_build_object('incident_reference', v_incident.display_reference)
  ) returning * into v_receipt;

  return query select v_incident.id, v_incident.display_reference, v_receipt.id, true;
end;
$$;

revoke all on function public.create_incident_report(uuid, text, timestamptz, uuid) from public;
grant execute on function public.create_incident_report(uuid, text, timestamptz, uuid) to authenticated;
