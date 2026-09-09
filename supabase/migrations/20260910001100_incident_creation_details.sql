-- Support the factual details captured by the Quick and Full report entry paths.

begin;

alter table public.incidents
  add column entry_mode text not null default 'quick' check (entry_mode in ('quick', 'full')),
  add column title text check (title is null or char_length(title) <= 200),
  add column report_source text not null default 'operator' check (report_source in ('operator', 'field_reporter', 'radio', 'member_of_public', 'emergency_service', 'other')),
  add column occurred_at timestamptz;

update public.incidents set occurred_at = reported_at where occurred_at is null;
alter table public.incidents alter column occurred_at set not null;

alter table public.incidents
  add column zone_id uuid,
  add constraint incidents_category_id_fkey foreign key (category_id) references public.incident_categories (id) on delete restrict,
  add constraint incidents_zone_event_fkey foreign key (event_id, zone_id) references public.event_zones (event_id, id) on delete restrict;

drop function public.create_incident_report(uuid, uuid, text, timestamptz, uuid);

create function public.create_incident_report(
  p_actor_id uuid,
  p_event_id uuid,
  p_entry_mode text,
  p_title text,
  p_initial_report text,
  p_report_source text,
  p_occurred_at timestamptz,
  p_category_id uuid,
  p_location_id uuid,
  p_zone_id uuid,
  p_severity text,
  p_idempotency_key uuid
)
returns table (incident_id uuid, incident_reference text, receipt_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.events%rowtype;
  v_incident public.incidents%rowtype;
  v_receipt public.command_receipts%rowtype;
  v_report text := nullif(btrim(p_initial_report), '');
  v_title text := nullif(btrim(p_title), '');
  v_entry_mode text := coalesce(nullif(btrim(p_entry_mode), ''), 'quick');
  v_source text := coalesce(nullif(btrim(p_report_source), ''), 'operator');
  v_severity text := coalesce(nullif(btrim(p_severity), ''), 'unknown');
  v_fingerprint jsonb;
  v_sequence integer;
begin
  if p_actor_id is null or p_event_id is null or p_occurred_at is null or p_idempotency_key is null then
    raise exception 'Actor, event, occurrence time, and idempotency key are required' using errcode = '22023';
  end if;
  if v_entry_mode not in ('quick', 'full') or v_source not in ('operator', 'field_reporter', 'radio', 'member_of_public', 'emergency_service', 'other') then
    raise exception 'The report entry details are invalid' using errcode = '22023';
  end if;
  if v_title is not null and char_length(v_title) > 200 or v_report is not null and char_length(v_report) > 4000 then
    raise exception 'The report content exceeds its character limit' using errcode = '22001';
  end if;
  if not app_private.has_internal_capability(p_actor_id, 'incident.create') then
    raise exception 'Incident creation is not permitted' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then raise exception 'Event is unavailable' using errcode = '22023'; end if;
  if p_category_id is not null and not exists (select 1 from public.incident_categories where id = p_category_id and is_active) then
    raise exception 'The incident category is unavailable' using errcode = '22023';
  end if;
  if p_location_id is not null and not exists (select 1 from public.event_locations where id = p_location_id and event_id = p_event_id) then
    raise exception 'The incident location is unavailable for this event' using errcode = '22023';
  end if;
  if p_zone_id is not null and not exists (select 1 from public.event_zones where id = p_zone_id and event_id = p_event_id) then
    raise exception 'The incident zone is unavailable for this event' using errcode = '22023';
  end if;
  if v_severity <> 'unknown' and not exists (select 1 from public.incident_severity_levels where code = v_severity and is_active) then
    raise exception 'The requested severity is unavailable' using errcode = '22023';
  end if;

  v_fingerprint := jsonb_build_object('actor_id', p_actor_id, 'event_id', p_event_id, 'entry_mode', v_entry_mode, 'title', v_title, 'initial_report', v_report, 'report_source', v_source, 'occurred_at', p_occurred_at, 'category_id', p_category_id, 'location_id', p_location_id, 'zone_id', p_zone_id, 'severity', v_severity);
  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));

  select * into v_receipt from public.command_receipts where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.command_type <> 'incident.report_received' or v_receipt.request_fingerprint <> v_fingerprint then raise exception 'Idempotency key was already used for a different command' using errcode = '23505'; end if;
    return query select v_receipt.incident_id, v_receipt.response_payload ->> 'incident_reference', v_receipt.id, false;
    return;
  end if;

  insert into public.incident_reference_sequences (event_id, last_number) values (v_event.id, 1)
  on conflict (event_id) do update set last_number = public.incident_reference_sequences.last_number + 1 returning last_number into v_sequence;
  insert into public.incidents (event_id, display_reference, entry_mode, title, initial_report, report_source, occurred_at, reported_at, category_id, location_id, zone_id, severity, created_by)
  values (v_event.id, format('INC-%s-%s', replace(v_event.display_reference, 'EVT-', ''), lpad(v_sequence::text, 4, '0')), v_entry_mode, v_title, v_report, v_source, p_occurred_at, now(), p_category_id, p_location_id, p_zone_id, v_severity, p_actor_id)
  returning * into v_incident;
  insert into public.incident_timeline_entries (event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by)
  values (v_incident.event_id, v_incident.id, 1, 'initial_report', 'operator', v_incident.initial_report, v_incident.reported_at, p_actor_id);
  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details)
  values (v_incident.event_id, v_incident.id, 'incident.reported', p_actor_id, jsonb_build_object('display_reference', v_incident.display_reference, 'entry_mode', v_incident.entry_mode));
  insert into public.operational_outbox (event_id, incident_id, topic, payload)
  values (v_incident.event_id, v_incident.id, 'incident.created', jsonb_build_object('incident_id', v_incident.id, 'incident_reference', v_incident.display_reference));
  insert into public.command_receipts (event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload)
  values (v_incident.event_id, p_actor_id, p_idempotency_key, 'incident.report_received', v_fingerprint, v_incident.id, jsonb_build_object('incident_reference', v_incident.display_reference)) returning * into v_receipt;
  return query select v_incident.id, v_incident.display_reference, v_receipt.id, true;
end;
$$;

revoke all on function public.create_incident_report(uuid, uuid, text, text, text, text, timestamptz, uuid, uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.create_incident_report(uuid, uuid, text, text, text, text, timestamptz, uuid, uuid, uuid, text, uuid) to service_role;

commit;
