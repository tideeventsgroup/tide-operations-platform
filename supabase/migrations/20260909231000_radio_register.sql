begin;

create type public.radio_status as enum ('in_store', 'issued', 'faulty', 'lost');

create table public.radios (
  id uuid primary key default gen_random_uuid(),
  unit_number smallint not null unique check (unit_number between 1 and 20),
  status public.radio_status not null default 'in_store',
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.radios (unit_number)
select unit_number from generate_series(1, 20) as unit_number;

create table public.radio_issue_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  radio_id uuid not null references public.radios (id) on delete restrict,
  holder_name text not null check (char_length(btrim(holder_name)) between 1 and 160),
  callsign text check (callsign is null or char_length(btrim(callsign)) between 1 and 80),
  holder_org text check (holder_org is null or char_length(btrim(holder_org)) between 1 and 120),
  issued_at timestamptz not null default now(),
  issued_by uuid not null references public.internal_users (id) on delete restrict,
  condition_out text check (condition_out is null or char_length(condition_out) <= 500),
  accessories_out text[] not null default '{}'::text[],
  returned_at timestamptz,
  returned_by uuid references public.internal_users (id) on delete restrict,
  condition_in text check (condition_in is null or char_length(condition_in) <= 500),
  accessories_in text[] not null default '{}'::text[],
  fault_flag boolean not null default false,
  fault_notes text check (fault_notes is null or char_length(fault_notes) <= 1000),
  check ((returned_at is null and returned_by is null and condition_in is null and not fault_flag and fault_notes is null) or (returned_at is not null and returned_by is not null and condition_in is not null)),
  check (not fault_flag or fault_notes is not null)
);

create unique index radio_issue_records_one_open_radio_idx on public.radio_issue_records (radio_id) where returned_at is null;
create index radio_issue_records_event_issued_idx on public.radio_issue_records (event_id, issued_at desc);

alter table public.radios enable row level security;
alter table public.radio_issue_records enable row level security;
revoke all on public.radios, public.radio_issue_records from anon, authenticated;
grant select, insert, update, delete on public.radios, public.radio_issue_records to service_role;

create schema if not exists app_private;
revoke all on schema app_private from public;

create function app_private.has_internal_capability(p_actor_id uuid, p_capability_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.internal_users user_record
    join public.role_capabilities capability on capability.role = user_record.role
    where user_record.id = p_actor_id
      and user_record.is_active
      and capability.capability_id = p_capability_id
  );
$$;

revoke all on function app_private.has_internal_capability(uuid, text) from public, anon, authenticated;
grant usage on schema app_private to service_role;
grant execute on function app_private.has_internal_capability(uuid, text) to service_role;

alter table public.operational_audit_events drop constraint if exists operational_audit_events_action_check;
alter table public.operational_audit_events add constraint operational_audit_events_action_check check (action in (
  'operational_period.opened', 'operational_period.closed', 'perimeter_check.recorded', 'casualty_record.created',
  'radio.issued', 'radio.returned', 'radio.exported'
));

create function public.issue_radio(
  p_actor_id uuid,
  p_event_id uuid,
  p_radio_id uuid,
  p_holder_name text,
  p_callsign text,
  p_holder_org text,
  p_condition_out text,
  p_accessories_out text[]
)
returns public.radio_issue_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_radio public.radios%rowtype; v_record public.radio_issue_records%rowtype;
begin
  if not app_private.has_internal_capability(p_actor_id, 'radio.issue') then raise exception 'Radio issue is not permitted' using errcode = '42501'; end if;
  if not exists (select 1 from public.events where id = p_event_id) then raise exception 'Event is unavailable' using errcode = '22023'; end if;
  select * into v_radio from public.radios where id = p_radio_id for update;
  if not found or v_radio.status <> 'in_store' then raise exception 'This radio is not available' using errcode = '23505'; end if;
  insert into public.radio_issue_records (event_id, radio_id, holder_name, callsign, holder_org, issued_by, condition_out, accessories_out)
  values (p_event_id, p_radio_id, nullif(btrim(p_holder_name), ''), nullif(btrim(p_callsign), ''), nullif(btrim(p_holder_org), ''), p_actor_id, nullif(btrim(p_condition_out), ''), coalesce(p_accessories_out, '{}'::text[]))
  returning * into v_record;
  update public.radios set status = 'issued', updated_at = now() where id = p_radio_id;
  insert into public.operational_audit_events (event_id, action, actor_profile_id, details)
  values (p_event_id, 'radio.issued', p_actor_id, jsonb_build_object('radio_id', p_radio_id, 'issue_record_id', v_record.id));
  return v_record;
end;
$$;

create function public.return_radio(
  p_actor_id uuid,
  p_issue_record_id uuid,
  p_condition_in text,
  p_accessories_in text[],
  p_fault_flag boolean,
  p_fault_notes text
)
returns public.radio_issue_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_record public.radio_issue_records%rowtype;
begin
  if not app_private.has_internal_capability(p_actor_id, 'radio.return') then raise exception 'Radio return is not permitted' using errcode = '42501'; end if;
  select * into v_record from public.radio_issue_records where id = p_issue_record_id for update;
  if not found or v_record.returned_at is not null then raise exception 'This radio issue is no longer open' using errcode = '23505'; end if;
  if nullif(btrim(p_condition_in), '') is null then raise exception 'Return condition is required' using errcode = '22023'; end if;
  if coalesce(p_fault_flag, false) and nullif(btrim(p_fault_notes), '') is null then raise exception 'Fault notes are required when a fault is flagged' using errcode = '22023'; end if;
  update public.radio_issue_records set returned_at = now(), returned_by = p_actor_id, condition_in = nullif(btrim(p_condition_in), ''), accessories_in = coalesce(p_accessories_in, '{}'::text[]), fault_flag = coalesce(p_fault_flag, false), fault_notes = nullif(btrim(p_fault_notes), '') where id = v_record.id returning * into v_record;
  update public.radios set status = case when v_record.fault_flag then 'faulty'::public.radio_status else 'in_store'::public.radio_status end, updated_at = now() where id = v_record.radio_id;
  insert into public.operational_audit_events (event_id, action, actor_profile_id, details)
  values (v_record.event_id, 'radio.returned', p_actor_id, jsonb_build_object('radio_id', v_record.radio_id, 'issue_record_id', v_record.id, 'fault_flag', v_record.fault_flag));
  return v_record;
end;
$$;

revoke all on function public.issue_radio(uuid, uuid, uuid, text, text, text, text, text[]) from public, anon, authenticated;
revoke all on function public.return_radio(uuid, uuid, text, text[], boolean, text) from public, anon, authenticated;
grant execute on function public.issue_radio(uuid, uuid, uuid, text, text, text, text, text[]) to service_role;
grant execute on function public.return_radio(uuid, uuid, text, text[], boolean, text) to service_role;

commit;
