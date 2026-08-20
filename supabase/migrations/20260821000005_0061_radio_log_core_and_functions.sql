-- Radio Log: append-only running log of radio/comms traffic for an event,
-- same append-only treatment as incident_log_entries/audit_logs — no
-- update/delete grant to authenticated at all, the only mutation path is
-- log_radio_entry() below. No enum introduced here, so core + functions
-- can live in one migration (unlike observations/incident_agencies, which
-- needed the enum committed before a later migration could use it).

create table radio_log_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  event_id uuid not null references events (id) on delete restrict,
  reference text not null unique,
  channel text,
  from_callsign text,
  to_callsign text,
  message text not null,
  significant boolean not null default false,
  linked_incident_id uuid references incidents (id) on delete set null,
  logged_by uuid references profiles (id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table radio_log_entries is 'Append-only radio/comms log for an event. Written only via log_radio_entry() — no update/delete grant to authenticated.';

create index radio_log_entries_event_id_idx on radio_log_entries (event_id, occurred_at desc);

create function log_radio_entry(
  p_event_id uuid,
  p_message text,
  p_channel text default null,
  p_from_callsign text default null,
  p_to_callsign text default null,
  p_significant boolean default false,
  p_linked_incident_id uuid default null,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_entry_id uuid;
  v_reference text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('radio_log.create', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to log radio traffic on this event';
  end if;
  if p_linked_incident_id is not null and not exists (
    select 1 from incidents where id = p_linked_incident_id and event_id = p_event_id
  ) then
    raise exception 'Linked incident does not belong to this event';
  end if;

  v_reference := next_event_reference(p_event_id, 'RLG');

  insert into radio_log_entries (
    organisation_id, event_id, reference, channel, from_callsign, to_callsign,
    message, significant, linked_incident_id, logged_by, occurred_at
  ) values (
    v_event.organisation_id, p_event_id, v_reference, p_channel, p_from_callsign, p_to_callsign,
    p_message, p_significant, p_linked_incident_id, auth.uid(), p_occurred_at
  )
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

revoke execute on function log_radio_entry(uuid, text, text, text, text, boolean, uuid, timestamptz) from public, anon, authenticated;
grant execute on function log_radio_entry(uuid, text, text, text, text, boolean, uuid, timestamptz) to authenticated;
