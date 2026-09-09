create table public.login_aliases (
  username text primary key check (
    username = lower(btrim(username))
    and username ~ '^[a-z][a-z0-9._-]{2,79}$'
  ),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.access_audit_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete restrict,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  subject_profile_id uuid not null references public.profiles (id) on delete restrict,
  action text not null check (action in ('access.owner_bootstrapped')),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index access_audit_events_organisation_occurred_idx
  on public.access_audit_events (organisation_id, occurred_at desc);

alter table public.login_aliases enable row level security;
alter table public.access_audit_events enable row level security;

revoke all on table public.login_aliases from public, anon, authenticated;

create policy "access audit select organisation admins" on public.access_audit_events
  for select to authenticated
  using (app_private.is_organisation_admin(organisation_id));

grant select on public.access_audit_events to authenticated;
