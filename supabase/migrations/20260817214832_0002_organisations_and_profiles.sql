-- Organisations (root of tenancy) and profiles (1:1 with auth.users).

create table organisations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,               -- e.g. 'TEG' — used in generated references
  name text not null,
  legal_name text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

comment on table organisations is 'Tenancy root. Tide Events Group Scotland is the first row; schema supports more.';
comment on column organisations.code is 'Short uppercase code used as the prefix in generated human-readable references, e.g. TEG-EVT-2026-0001.';

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organisation_id uuid references organisations (id) on delete restrict,
  account_type account_type not null default 'pending',
  first_name text,
  surname text,
  preferred_name text,
  email text not null,
  phone text,
  profile_image_url text,
  status profile_status not null default 'active',
  mfa_enabled boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

comment on table profiles is 'Extends auth.users. New signups land with account_type=pending and organisation_id=null; an admin promotes and assigns an organisation via user_roles + this row.';

create index profiles_organisation_id_idx on profiles (organisation_id);

-- Every new Supabase Auth user gets a pending profile row automatically.
-- There is deliberately no "first user becomes admin" path — bootstrap is
-- a documented manual SQL step (see README).
create function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Generic atomic reference-number generator. One counter table serves every
-- entity type instead of a bespoke counter table per entity (incidents,
-- events, documents, ...): concurrency-safe via UPSERT row-level locking.
create table id_counters (
  organisation_id uuid not null references organisations (id) on delete restrict,
  entity_type text not null,       -- e.g. 'EVT', 'INC', 'CLI', 'DEC', 'ACT'
  year int,                        -- null for entities that don't reset yearly (e.g. clients)
  seq bigint not null default 0,
  primary key (organisation_id, entity_type, year)
);

comment on table id_counters is 'Backing store for next_reference(). Never queried directly by application code.';

create function next_reference(
  p_organisation_id uuid,
  p_entity_type text,
  p_use_year boolean default true,
  p_suffix_width int default 4
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int;
  v_seq bigint;
  v_org_code text;
begin
  v_year := case when p_use_year then extract(year from now())::int else null end;

  insert into id_counters (organisation_id, entity_type, year, seq)
  values (p_organisation_id, p_entity_type, v_year, 1)
  on conflict (organisation_id, entity_type, year)
  do update set seq = id_counters.seq + 1
  returning seq into v_seq;

  select code into v_org_code from organisations where id = p_organisation_id;

  if v_year is not null then
    return format('%s-%s-%s-%s', v_org_code, p_entity_type, v_year, lpad(v_seq::text, p_suffix_width, '0'));
  else
    return format('%s-%s-%s', v_org_code, p_entity_type, lpad(v_seq::text, p_suffix_width, '0'));
  end if;
end;
$$;

comment on function next_reference is 'Atomically generates human-readable references like TEG-EVT-2026-0001. Call inside the same statement/trigger as the row insert.';
