begin;

alter table public.clients drop constraint clients_display_reference_check;
alter table public.clients add constraint clients_display_reference_check check (display_reference ~ '^[A-Z][A-Z0-9-]{2,79}$');
alter table public.events drop constraint events_display_reference_check;
alter table public.events add constraint events_display_reference_check check (display_reference ~ '^[A-Z][A-Z0-9-]{2,79}$');

do $$
declare
  v_actor_id uuid;
  v_client_id uuid;
  v_event_id uuid;
begin
  select id into v_actor_id from public.internal_users where is_active and role = 'admin' order by created_at limit 1;
  if v_actor_id is null then raise exception 'An active internal administrator is required to seed SOF26' using errcode = '42501'; end if;

  insert into public.clients (name, display_reference, registration_reference)
  values ('Stranraer Development Trust', 'TEG-CLI-0001', 'SC046306')
  on conflict (display_reference) do update
    set name = excluded.name, registration_reference = excluded.registration_reference
  returning id into v_client_id;

  insert into public.events (client_id, name, display_reference, timezone, starts_at, ends_at, created_by, document_reference_prefix)
  values (
    v_client_id,
    'Stranraer Oyster Festival 2026',
    'TEG-EVT-2026-0001',
    'Europe/London',
    '2026-09-11 17:00:00+01'::timestamptz,
    '2026-09-13 18:00:00+01'::timestamptz,
    v_actor_id,
    'TEG-EVT-2026-0001'
  )
  on conflict (display_reference) do update
    set client_id = excluded.client_id, name = excluded.name, timezone = excluded.timezone,
        starts_at = excluded.starts_at, ends_at = excluded.ends_at,
        document_reference_prefix = excluded.document_reference_prefix
  returning id into v_event_id;

  insert into public.event_zones (event_id, code, name, capacity, use_type, notes) values
    (v_event_id, 'A', 'Zone A', 2338, 'standard_occupancy', null),
    (v_event_id, 'B', 'Zone B', 3076, 'standard_occupancy', null),
    (v_event_id, 'C', 'Zone C', 4194, 'standard_occupancy', null),
    (v_event_id, 'D', 'Zone D', 1754, 'evacuation_exit_only', 'Evacuation exit only; not for standard occupancy.')
  on conflict (event_id, code) do update
    set name = excluded.name, capacity = excluded.capacity, use_type = excluded.use_type, notes = excluded.notes;

  insert into public.event_radio_channels (event_id, channel_number, name, purpose, silent_net) values
    (v_event_id, 1, 'OPS', 'Operational coordination', false),
    (v_event_id, 2, 'Festival Ops', 'Festival operations', false),
    (v_event_id, 3, 'Security & Stewards', 'Combined security and stewarding', false),
    (v_event_id, 4, 'Medical', 'Medical coordination', false),
    (v_event_id, 5, 'Emergency', 'Emergency silent net', true)
  on conflict (event_id, channel_number) do update
    set name = excluded.name, purpose = excluded.purpose, silent_net = excluded.silent_net;

  insert into public.event_command_assignments (event_id, callsign, person_name, role_title, internal_user_id) values
    (v_event_id, 'GOLD', 'Romano Petrucci', 'Event Director / Chairman, Stranraer Development Trust', null),
    (v_event_id, 'SILVER 1', 'Enrico Petrucci', 'FMIC (SDT)', null),
    (v_event_id, 'SILVER 2', 'Allana Hardie', 'FMIC (SDT)', null),
    (v_event_id, 'SIERRA 1', 'Paul Quinn', 'SIA Supervisor', null),
    (v_event_id, 'CONTROL', 'Kyle Robb', 'Event Control', (select id from public.internal_users where username = 'kyle.robb' and is_active limit 1))
  on conflict (event_id, callsign) do update
    set person_name = excluded.person_name, role_title = excluded.role_title, internal_user_id = excluded.internal_user_id;

  insert into public.event_operational_profiles (
    event_id, declared_concurrent_capacity, daily_ticket_cap, egress_clearance_target_minutes,
    combined_exit_width_metres, latitude, longitude, control_room_location,
    control_room_width_metres, control_room_depth_metres, cctv_deployed, nearest_ae,
    threat_level, threat_checked_at, threat_source_url, regulatory_planning_status, regulatory_notes
  ) values (
    v_event_id, 11362, 10000, 8, 15, 54.906093, -5.028804, 'SDT office',
    5.5, 4.0, false, 'Stranraer Hospital', 'severe', '2026-08-19',
    'https://www.mi5.gov.uk/threats-and-advice/terrorism-threat-levels', 'planning_basis',
    'Enhanced-tier / qualifying-event planning basis. The Terrorism (Protection of Premises) Act 2025 operational duties were not commenced at the time this record was seeded.'
  ) on conflict (event_id) do update set
    declared_concurrent_capacity = excluded.declared_concurrent_capacity,
    daily_ticket_cap = excluded.daily_ticket_cap,
    egress_clearance_target_minutes = excluded.egress_clearance_target_minutes,
    combined_exit_width_metres = excluded.combined_exit_width_metres,
    latitude = excluded.latitude, longitude = excluded.longitude,
    control_room_location = excluded.control_room_location,
    control_room_width_metres = excluded.control_room_width_metres,
    control_room_depth_metres = excluded.control_room_depth_metres,
    cctv_deployed = excluded.cctv_deployed, nearest_ae = excluded.nearest_ae,
    threat_level = excluded.threat_level, threat_checked_at = excluded.threat_checked_at,
    threat_source_url = excluded.threat_source_url,
    regulatory_planning_status = excluded.regulatory_planning_status,
    regulatory_notes = excluded.regulatory_notes, updated_at = now();
end;
$$;

commit;
