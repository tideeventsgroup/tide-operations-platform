-- Convert the app from tenant-scoped Supabase Auth to one internal organisation.
-- Existing UUIDs and bcrypt password hashes stay inside Postgres throughout.

begin;

drop schema if exists app_private cascade;

drop function if exists public.close_operational_period(uuid, integer, text, boolean, boolean, boolean, boolean, uuid);
drop function if exists public.create_casualty_record(uuid, text, text, text, text, text, uuid);
drop function if exists public.create_incident_report(uuid, text, timestamptz, uuid);
drop function if exists public.open_operational_period(uuid, text, uuid);
drop function if exists public.record_perimeter_check(uuid, text, text, text, uuid);
drop function if exists public.transition_incident(uuid, integer, text, text, text, uuid);

do $$
declare policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

-- Tenant composite foreign keys must be removed before the matching unique
-- constraints. PostgreSQL otherwise preserves the dependent unique index.
do $$
declare constraint_record record;
begin
  for constraint_record in
    select distinct constraint_table.table_schema, constraint_table.table_name, constraint_table.constraint_name
    from information_schema.table_constraints constraint_table
    join information_schema.key_column_usage key_column
      on key_column.constraint_schema = constraint_table.constraint_schema
      and key_column.constraint_name = constraint_table.constraint_name
    where constraint_table.constraint_type = 'FOREIGN KEY'
      and key_column.column_name = 'organisation_id'
      and constraint_table.table_schema = 'public'
  loop
    execute format('alter table %I.%I drop constraint if exists %I', constraint_record.table_schema, constraint_record.table_name, constraint_record.constraint_name);
  end loop;

  for constraint_record in
    select distinct constraint_table.table_schema, constraint_table.table_name, constraint_table.constraint_name
    from information_schema.table_constraints constraint_table
    join information_schema.key_column_usage key_column
      on key_column.constraint_schema = constraint_table.constraint_schema
      and key_column.constraint_name = constraint_table.constraint_name
    where constraint_table.constraint_type = 'UNIQUE'
      and key_column.column_name = 'organisation_id'
      and constraint_table.table_schema = 'public'
  loop
    execute format('alter table %I.%I drop constraint if exists %I', constraint_record.table_schema, constraint_record.table_name, constraint_record.constraint_name);
  end loop;
end $$;

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles rename to internal_users;

create type public.internal_role as enum ('admin', 'event_control', 'fmic', 'staff', 'view_only');

alter table public.internal_users
  add column username text,
  add column password_hash text,
  add column role public.internal_role not null default 'view_only',
  add column is_active boolean not null default true;

-- Translate existing operational roles before removing the membership table.
-- Multiple historical membership rows resolve to the most privileged internal role.
update public.internal_users user_record
set role = role_map.role
from (
  select
    membership.profile_id,
    max(
      case membership.role::text
        when 'organisation_admin' then 4
        when 'event_manager' then 4
        when 'event_control_manager' then 3
        when 'event_control_operator' then 3
        when 'field_reporter' then 2
        when 'client_user' then 1
        when 'read_only' then 1
        when 'auditor' then 1
        else 1
      end
    ) as role_rank
  from public.organisation_memberships membership
  group by membership.profile_id
) ranked
join lateral (
  select case ranked.role_rank
    when 4 then 'admin'::public.internal_role
    when 3 then 'event_control'::public.internal_role
    when 2 then 'staff'::public.internal_role
    else 'view_only'::public.internal_role
  end as role
) role_map on true
where user_record.id = ranked.profile_id;

drop table if exists public.event_access;
drop table if exists public.organisation_memberships;
drop table if exists public.login_aliases;

update public.internal_users user_record
set username = lower(auth_user.raw_user_meta_data ->> 'username'),
    password_hash = auth_user.encrypted_password
from auth.users auth_user
where auth_user.id = user_record.id;

update public.internal_users
set username = case id
  when 'db811893-65af-41d7-8674-a189b2014c33'::uuid then 'kyle.robb'
  when '7016d02c-6c79-4738-9f8a-a54256b0de92'::uuid then 'ops'
  else 'user-' || replace(id::text, '-', '')
end
where username is null or username = '';

alter table public.internal_users
  alter column username set not null,
  alter column password_hash set not null,
  add constraint internal_users_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{1,62}$'),
  add constraint internal_users_username_key unique (username);

do $$
declare column_record record;
begin
  for column_record in
    select table_schema, table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'organisation_id'
  loop
    execute format('alter table %I.%I drop column organisation_id', column_record.table_schema, column_record.table_name);
  end loop;
end $$;

drop table if exists public.organisations;
drop table if exists public.role_capabilities;
drop type if exists public.app_role;

create table public.role_capabilities (
  role public.internal_role not null,
  capability_id text not null references public.capabilities (id) on delete cascade,
  primary key (role, capability_id)
);

insert into public.capabilities (id, description) values
  ('radio.read', 'View the radio fleet and reconciliation.'),
  ('radio.issue', 'Issue an available radio.'),
  ('radio.return', 'Return an issued radio and record a fault.'),
  ('radio.export', 'Export an event radio log.')
on conflict do nothing;

insert into public.role_capabilities (role, capability_id) values
  ('admin', 'event.read'), ('admin', 'event.manage'), ('admin', 'incident.read'),
  ('admin', 'incident.create'), ('admin', 'incident.manage'), ('admin', 'timeline.append'),
  ('admin', 'action.manage'), ('admin', 'decision.record'), ('admin', 'resource.manage'),
  ('admin', 'audit.read'), ('admin', 'radio.read'), ('admin', 'radio.issue'),
  ('admin', 'radio.return'), ('admin', 'radio.export'),
  ('event_control', 'event.read'), ('event_control', 'incident.read'),
  ('event_control', 'incident.create'), ('event_control', 'incident.manage'),
  ('event_control', 'timeline.append'), ('event_control', 'radio.read'),
  ('event_control', 'radio.issue'), ('event_control', 'radio.return'), ('event_control', 'radio.export'),
  ('fmic', 'event.read'), ('fmic', 'incident.read'), ('fmic', 'incident.manage'),
  ('fmic', 'timeline.append'), ('fmic', 'radio.read'),
  ('staff', 'event.read'), ('staff', 'incident.create'), ('staff', 'radio.read'),
  ('view_only', 'event.read'), ('view_only', 'incident.read'), ('view_only', 'radio.read')
on conflict do nothing;

alter table public.events add constraint events_client_id_fkey foreign key (client_id) references public.clients (id);
alter table public.event_locations add constraint event_locations_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.incident_reference_sequences add constraint incident_reference_sequences_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.incidents add constraint incidents_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.incidents add constraint incidents_location_id_fkey foreign key (location_id) references public.event_locations (id);
alter table public.incident_timeline_entries add constraint incident_timeline_entries_incident_id_fkey foreign key (incident_id) references public.incidents (id) on delete cascade;
alter table public.incident_audit_events add constraint incident_audit_events_incident_id_fkey foreign key (incident_id) references public.incidents (id) on delete cascade;
alter table public.incident_transitions add constraint incident_transitions_incident_id_fkey foreign key (incident_id) references public.incidents (id) on delete cascade;
alter table public.command_receipts add constraint command_receipts_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.command_receipts add constraint command_receipts_incident_id_fkey foreign key (incident_id) references public.incidents (id) on delete cascade;
alter table public.operational_outbox add constraint operational_outbox_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.operational_outbox add constraint operational_outbox_incident_id_fkey foreign key (incident_id) references public.incidents (id) on delete cascade;
alter table public.operational_periods add constraint operational_periods_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.perimeter_checks add constraint perimeter_checks_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.perimeter_checks add constraint perimeter_checks_period_id_fkey foreign key (operational_period_id) references public.operational_periods (id) on delete cascade;
alter table public.casualty_records add constraint casualty_records_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.casualty_records add constraint casualty_records_incident_id_fkey foreign key (incident_id) references public.incidents (id) on delete cascade;
alter table public.operational_audit_events add constraint operational_audit_events_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;
alter table public.operational_audit_events add constraint operational_audit_events_incident_id_fkey foreign key (incident_id) references public.incidents (id) on delete cascade;
alter table public.operational_audit_events add constraint operational_audit_events_period_id_fkey foreign key (operational_period_id) references public.operational_periods (id) on delete cascade;
alter table public.operational_command_receipts add constraint operational_command_receipts_event_id_fkey foreign key (event_id) references public.events (id) on delete cascade;

do $$
declare table_record record;
begin
  for table_record in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_record.tablename);
    execute format('revoke all on table public.%I from anon, authenticated', table_record.tablename);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_record.tablename);
  end loop;
end $$;

revoke usage on schema public from anon, authenticated;
grant usage on schema public to service_role;
alter default privileges for role postgres in schema public revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

commit;
