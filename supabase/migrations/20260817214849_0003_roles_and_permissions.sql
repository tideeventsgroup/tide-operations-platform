-- Granular role/permission architecture (spec §18-19). Not isAdmin.
-- A user's role can differ per event, so grants are scoped rather than global.

create table roles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations (id) on delete cascade, -- null = system catalog role, usable by any org
  code text not null,               -- e.g. 'event_controller'
  name text not null,
  description text,
  is_system boolean not null default false,
  is_external boolean not null default false, -- client/contractor-facing role vs internal Tide role
  created_at timestamptz not null default now(),
  unique (organisation_id, code)
);

comment on table roles is 'Catalog of assignable roles. System roles (organisation_id null) match spec §18; organisations may add custom roles.';

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,        -- '<module>.<action>', e.g. 'incident.view_restricted'
  module text not null,
  action text not null,
  description text
);

create table role_permissions (
  role_id uuid not null references roles (id) on delete cascade,
  permission_id uuid not null references permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Scoped grant: exactly one of organisation-only / client / event narrows
-- the grant. A grant with only organisation_id set applies to every client
-- and event under that organisation (broad-to-narrow, not the reverse).
-- client_id/event_id gain their FK constraints once those tables exist
-- (0004_clients_and_events.sql, incident-phase migration) — the columns
-- exist from day one so has_permission()'s signature never has to change.
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  role_id uuid not null references roles (id) on delete restrict,
  organisation_id uuid not null references organisations (id) on delete restrict,
  client_id uuid,
  event_id uuid,
  granted_by uuid references profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references profiles (id) on delete set null,
  revoked_at timestamptz
);

create index user_roles_user_id_idx on user_roles (user_id) where revoked_at is null;
create index user_roles_org_idx on user_roles (organisation_id) where revoked_at is null;
create index user_roles_event_idx on user_roles (event_id) where revoked_at is null and event_id is not null;
create index user_roles_client_idx on user_roles (client_id) where revoked_at is null and client_id is not null;

comment on table user_roles is 'Scoped role grants. granted_by/revoked_by use SET NULL on profile deletion so offboarding a grantor never blocks deleting their account.';
