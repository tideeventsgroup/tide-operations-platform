-- Restore incident creation after moving application identity from Supabase Auth
-- to internal Auth.js users. This command is service-role-only and validates the
-- explicitly supplied internal actor before it writes an operational record.

begin;

create or replace function public.create_incident_report(
  p_actor_id uuid,
  p_event_id uuid,
  p_initial_report text,
  p_occurred_at timestamptz,
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
  v_fingerprint jsonb;
  v_sequence integer;
begin
  if p_actor_id is null or p_event_id is null or p_occurred_at is null or p_idempotency_key is null then
    raise exception 'Actor, event, occurrence time, and idempotency key are required' using errcode = '22023';
  end if;

  if v_report is not null and char_length(v_report) > 4000 then
    raise exception 'Initial report exceeds the 4000 character limit' using errcode = '22001';
  end if;

  if not app_private.has_internal_capability(p_actor_id, 'incident.create') then
    raise exception 'Incident creation is not permitted' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'Event is unavailable' using errcode = '22023';
  end if;

  v_fingerprint := jsonb_build_object(
    'actor_id', p_actor_id,
    'event_id', p_event_id,
    'initial_report', v_report,
    'occurred_at', p_occurred_at
  );

  perform pg_advisory_xact_lock(hashtextextended(p_actor_id::text || p_idempotency_key::text, 0));

  select * into v_receipt
  from public.command_receipts
  where actor_profile_id = p_actor_id and idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.command_type <> 'incident.report_received' or v_receipt.request_fingerprint <> v_fingerprint then
      raise exception 'Idempotency key was already used for a different command' using errcode = '23505';
    end if;

    return query select v_receipt.incident_id, v_receipt.response_payload ->> 'incident_reference', v_receipt.id, false;
    return;
  end if;

  insert into public.incident_reference_sequences (event_id, last_number)
  values (v_event.id, 1)
  on conflict (event_id) do update set last_number = public.incident_reference_sequences.last_number + 1
  returning last_number into v_sequence;

  insert into public.incidents (event_id, display_reference, initial_report, reported_at, created_by)
  values (
    v_event.id,
    format('INC-%s-%s', replace(v_event.display_reference, 'EVT-', ''), lpad(v_sequence::text, 4, '0')),
    v_report,
    p_occurred_at,
    p_actor_id
  )
  returning * into v_incident;

  insert into public.incident_timeline_entries (
    event_id, incident_id, sequence_number, entry_type, source, content, occurred_at, authored_by
  ) values (
    v_incident.event_id, v_incident.id, 1, 'initial_report', 'operator',
    v_incident.initial_report, v_incident.reported_at, p_actor_id
  );

  insert into public.incident_audit_events (event_id, incident_id, action, actor_profile_id, details)
  values (
    v_incident.event_id, v_incident.id, 'incident.reported', p_actor_id,
    jsonb_build_object('display_reference', v_incident.display_reference)
  );

  insert into public.operational_outbox (event_id, incident_id, topic, payload)
  values (
    v_incident.event_id, v_incident.id, 'incident.created',
    jsonb_build_object('incident_id', v_incident.id, 'incident_reference', v_incident.display_reference)
  );

  insert into public.command_receipts (
    event_id, actor_profile_id, idempotency_key, command_type, request_fingerprint, incident_id, response_payload
  ) values (
    v_incident.event_id, p_actor_id, p_idempotency_key, 'incident.report_received',
    v_fingerprint, v_incident.id, jsonb_build_object('incident_reference', v_incident.display_reference)
  )
  returning * into v_receipt;

  return query select v_incident.id, v_incident.display_reference, v_receipt.id, true;
end;
$$;

revoke all on function public.create_incident_report(uuid, uuid, text, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.create_incident_report(uuid, uuid, text, timestamptz, uuid) to service_role;

commit;
