create type public.app_role as enum (
  'organisation_admin',
  'event_manager',
  'event_control_manager',
  'event_control_operator',
  'field_reporter',
  'client_user',
  'read_only',
  'auditor'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_memberships (
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (organisation_id, profile_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 160),
  display_reference text not null unique check (display_reference ~ '^CL-[A-Z0-9-]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organisation_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete restrict,
  client_id uuid not null,
  name text not null check (char_length(name) between 1 and 160),
  display_reference text not null unique check (display_reference ~ '^EVT-[A-Z0-9-]+$'),
  timezone text not null check (char_length(timezone) between 1 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_time_range check (ends_at >= starts_at),
  constraint event_client_tenant_fk foreign key (client_id, organisation_id)
    references public.clients (id, organisation_id),
  unique (id, organisation_id)
);

create table public.event_access (
  event_id uuid not null,
  organisation_id uuid not null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid not null references public.profiles (id),
  granted_at timestamptz not null default now(),
  primary key (event_id, profile_id),
  constraint event_access_tenant_fk foreign key (event_id, organisation_id)
    references public.events (id, organisation_id),
  constraint event_access_membership_fk foreign key (organisation_id, profile_id)
    references public.organisation_memberships (organisation_id, profile_id)
);

create index event_access_profile_event_idx
  on public.event_access (profile_id, event_id);
create index events_client_idx on public.events (client_id, starts_at desc);
create index clients_organisation_idx on public.clients (organisation_id, name);

create schema if not exists app_private;
revoke all on schema app_private from public;

create function app_private.is_organisation_member(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = target_organisation_id
      and membership.profile_id = (select auth.uid())
  );
$$;

create function app_private.is_organisation_admin(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = target_organisation_id
      and membership.profile_id = (select auth.uid())
      and membership.role in ('organisation_admin', 'event_manager')
  );
$$;

create function app_private.can_access_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
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
  );
$$;

create function app_private.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.events event
    where event.client_id = target_client_id
      and app_private.can_access_event(event.id)
  );
$$;

revoke all on all functions in schema app_private from public;
grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.event_access enable row level security;

create policy "profiles select self" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles insert self" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles update self" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "organisations select members" on public.organisations
  for select to authenticated using (
    created_by = (select auth.uid())
    or app_private.is_organisation_member(id)
  );
create policy "organisations create self" on public.organisations
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "organisations update admins" on public.organisations
  for update to authenticated using (app_private.is_organisation_admin(id))
  with check (app_private.is_organisation_admin(id));

create policy "memberships select self or admin" on public.organisation_memberships
  for select to authenticated using (
    profile_id = (select auth.uid())
    or app_private.is_organisation_admin(organisation_id)
  );
create policy "memberships bootstrap or admin" on public.organisation_memberships
  for insert to authenticated with check (
    exists (
      select 1
      from public.organisations organisation
      where organisation.id = organisation_id
        and organisation.created_by = (select auth.uid())
    )
    or app_private.is_organisation_admin(organisation_id)
  );
create policy "memberships update admins" on public.organisation_memberships
  for update to authenticated using (app_private.is_organisation_admin(organisation_id))
  with check (app_private.is_organisation_admin(organisation_id));

create policy "clients select event access" on public.clients
  for select to authenticated using (app_private.can_access_client(id));
create policy "clients manage admins" on public.clients
  for all to authenticated using (app_private.is_organisation_admin(organisation_id))
  with check (app_private.is_organisation_admin(organisation_id));

create policy "events select event access" on public.events
  for select to authenticated using (app_private.can_access_event(id));
create policy "events manage admins" on public.events
  for all to authenticated using (app_private.is_organisation_admin(organisation_id))
  with check (
    app_private.is_organisation_admin(organisation_id)
    and created_by = (select auth.uid())
  );

create policy "event access select self or admin" on public.event_access
  for select to authenticated using (
    profile_id = (select auth.uid())
    or app_private.is_organisation_admin(organisation_id)
  );
create policy "event access manage admins" on public.event_access
  for all to authenticated using (app_private.is_organisation_admin(organisation_id))
  with check (app_private.is_organisation_admin(organisation_id));

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.organisations to authenticated;
grant select, insert, update on public.organisation_memberships to authenticated;
grant select, insert, update on public.clients to authenticated;
grant select, insert, update on public.events to authenticated;
grant select, insert, update on public.event_access to authenticated;
