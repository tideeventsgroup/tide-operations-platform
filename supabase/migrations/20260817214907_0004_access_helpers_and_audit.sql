-- RLS building blocks. Every policy in this project composes from these
-- functions rather than repeating the join logic inline.

create function current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and account_type = 'staff' and status = 'active'
  );
$$;

create function current_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id from profiles where id = auth.uid();
$$;

-- Scope-aware permission check. A grant applies if it matches the exact
-- scope requested, or is a broader grant that covers it (org-level grant
-- covers every client/event in that org; client-level grant covers every
-- event under that client). p_event_id/p_client_id resolution to their
-- owning org/client is added once the events/clients tables exist —
-- until then, only organisation-scoped grants are meaningful because
-- nothing narrower can exist yet.
create function has_permission(
  p_permission_code text,
  p_organisation_id uuid default null,
  p_client_id uuid default null,
  p_event_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and ur.revoked_at is null
      and p.code = p_permission_code
      and (
        (p_event_id is not null and ur.event_id = p_event_id)
        or (p_client_id is not null and ur.client_id is not null and ur.client_id = p_client_id)
        or (
          coalesce(p_organisation_id, current_organisation_id()) is not null
          and ur.client_id is null
          and ur.event_id is null
          and ur.organisation_id = coalesce(p_organisation_id, current_organisation_id())
        )
      )
  );
$$;

comment on function has_permission is 'Scope-aware permission check. See docs/architecture.md §6. Will gain client-covers-event / org-covers-client join resolution once those tables exist.';

create function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select has_permission('organisation.administer');
$$;

-- Append-only audit trail.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  organisation_id uuid references organisations (id) on delete set null,
  event_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  session_meta jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_idx on audit_logs (organisation_id, created_at desc);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

comment on table audit_logs is 'Append-only. No UPDATE/DELETE grant to any application role — see 0005 RLS. Rows are written exclusively via record_audit_event().';

create function record_audit_event(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_organisation_id uuid default null,
  p_event_id uuid default null,
  p_before_state jsonb default null,
  p_after_state jsonb default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into audit_logs (
    actor_id, organisation_id, event_id, entity_type, entity_id,
    action, before_state, after_state, reason
  ) values (
    auth.uid(), coalesce(p_organisation_id, current_organisation_id()), p_event_id, p_entity_type, p_entity_id,
    p_action, p_before_state, p_after_state, p_reason
  )
  returning id into v_id;

  return v_id;
end;
$$;
