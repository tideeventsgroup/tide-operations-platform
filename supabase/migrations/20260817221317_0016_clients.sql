-- Phase 2: Clients. Client register + reusable contacts with roles (spec §26-27).

create table clients (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete restrict,
  reference text not null unique,
  legal_name text not null,
  trading_name text,
  company_number text,
  charity_number text,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  country text default 'United Kingdom',
  billing_email text,
  billing_notes text,
  website text,
  account_owner_id uuid references profiles (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index clients_organisation_id_idx on clients (organisation_id);

comment on table clients is 'Client register (spec §26). reference is the permanent TEG-CLI-0001 correspondence ID.';

create function set_client_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := next_reference(new.organisation_id, 'CLI', false);
  end if;
  return new;
end;
$$;

create trigger clients_set_reference
  before insert on clients
  for each row execute function set_client_reference();

create function prevent_reference_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reference is distinct from old.reference then
    raise exception 'reference is immutable once assigned';
  end if;
  return new;
end;
$$;

create trigger clients_reference_immutable
  before update on clients
  for each row execute function prevent_reference_update();

revoke execute on function set_client_reference() from public, anon, authenticated;
revoke execute on function prevent_reference_update() from public, anon, authenticated;

-- Reusable contact roles (spec §27) — configurable, seeded with the spec's
-- starting set.
create table contact_role_types (
  code text primary key,
  name text not null
);

insert into contact_role_types (code, name) values
  ('event_lead', 'Event Lead'),
  ('operations', 'Operations'),
  ('safety', 'Safety'),
  ('licensing', 'Licensing'),
  ('finance', 'Finance'),
  ('marketing', 'Marketing'),
  ('contract', 'Contract'),
  ('emergency', 'Emergency'),
  ('senior_management', 'Senior Management');

create table client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  first_name text not null,
  surname text not null,
  title text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index client_contacts_client_id_idx on client_contacts (client_id);

create table client_contact_roles (
  contact_id uuid not null references client_contacts (id) on delete cascade,
  role_code text not null references contact_role_types (code) on delete restrict,
  primary key (contact_id, role_code)
);
