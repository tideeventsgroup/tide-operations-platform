-- Internal helper: is there an active user_roles grant in this org, other
-- than (optionally) one specific role, that confers organisation.administer?
-- Never granted to authenticated — callable only from inside the other
-- SECURITY DEFINER functions in this migration.
create function org_has_other_administrator(p_organisation_id uuid, p_excluding_role_id uuid)
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
    where ur.organisation_id = p_organisation_id
      and ur.revoked_at is null
      and p.code = 'organisation.administer'
      and ur.role_id <> p_excluding_role_id
  );
$$;

revoke execute on function org_has_other_administrator(uuid, uuid) from public, anon, authenticated;

create function create_role(
  p_organisation_id uuid,
  p_code text,
  p_name text,
  p_description text default null,
  p_is_external boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  if not has_permission('organisation.administer', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage roles';
  end if;
  if p_code !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'Role code must be lowercase letters, numbers and underscores.';
  end if;
  if exists (select 1 from roles where is_system and code = p_code) then
    raise exception 'That code is reserved by a system role.';
  end if;
  if exists (select 1 from roles where organisation_id = p_organisation_id and code = p_code) then
    raise exception 'A role with code "%" already exists in this organisation.', p_code;
  end if;

  insert into roles (organisation_id, code, name, description, is_system, is_external)
  values (p_organisation_id, p_code, p_name, p_description, false, p_is_external)
  returning id into v_role_id;

  return v_role_id;
end;
$$;

create function update_role(p_role_id uuid, p_name text, p_description text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role roles%rowtype;
begin
  select * into v_role from roles where id = p_role_id;
  if v_role.id is null then raise exception 'Role not found.'; end if;
  if v_role.is_system then raise exception 'System roles cannot be edited.'; end if;
  if not has_permission('organisation.administer', v_role.organisation_id, null, null) then
    raise exception 'Not authorised to manage roles';
  end if;

  update roles set name = p_name, description = p_description where id = p_role_id;
end;
$$;

create function delete_role(p_role_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role roles%rowtype;
  v_active int;
  v_total int;
  v_confers_admin boolean;
begin
  select * into v_role from roles where id = p_role_id;
  if v_role.id is null then raise exception 'Role not found.'; end if;
  if v_role.is_system then raise exception 'System roles cannot be deleted.'; end if;
  if not has_permission('organisation.administer', v_role.organisation_id, null, null) then
    raise exception 'Not authorised to manage roles';
  end if;

  select count(*) into v_active from user_roles where role_id = p_role_id and revoked_at is null;
  if v_active > 0 then
    raise exception '% user(s) currently hold this role. Revoke it from them first.', v_active;
  end if;

  select count(*) into v_total from user_roles where role_id = p_role_id;
  if v_total > 0 then
    raise exception 'This role has been granted historically and is part of the audit trail. It cannot be deleted, but you can rename it and remove its permissions.';
  end if;

  select exists (
    select 1 from role_permissions rp join permissions p on p.id = rp.permission_id
    where rp.role_id = p_role_id and p.code = 'organisation.administer'
  ) into v_confers_admin;
  if v_confers_admin and not org_has_other_administrator(v_role.organisation_id, p_role_id) then
    raise exception 'Removing this would leave the organisation with no administrator.';
  end if;

  delete from roles where id = p_role_id;
end;
$$;

create function grant_role_permission(p_role_id uuid, p_permission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role roles%rowtype;
begin
  select * into v_role from roles where id = p_role_id;
  if v_role.id is null then raise exception 'Role not found.'; end if;
  if not exists (select 1 from permissions where id = p_permission_id) then raise exception 'Permission not found.'; end if;
  if v_role.is_system then raise exception 'System role permissions cannot be changed.'; end if;
  if not has_permission('organisation.administer', v_role.organisation_id, null, null) then
    raise exception 'Not authorised to manage roles';
  end if;

  insert into role_permissions (role_id, permission_id) values (p_role_id, p_permission_id)
  on conflict (role_id, permission_id) do nothing;
end;
$$;

create function revoke_role_permission(p_role_id uuid, p_permission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role roles%rowtype;
  v_perm permissions%rowtype;
begin
  select * into v_role from roles where id = p_role_id;
  if v_role.id is null then raise exception 'Role not found.'; end if;
  select * into v_perm from permissions where id = p_permission_id;
  if v_perm.id is null then raise exception 'Permission not found.'; end if;
  if v_role.is_system then raise exception 'System role permissions cannot be changed.'; end if;
  if not has_permission('organisation.administer', v_role.organisation_id, null, null) then
    raise exception 'Not authorised to manage roles';
  end if;

  if v_perm.code = 'organisation.administer' and not org_has_other_administrator(v_role.organisation_id, p_role_id) then
    raise exception 'Removing this would leave the organisation with no administrator.';
  end if;

  delete from role_permissions where role_id = p_role_id and permission_id = p_permission_id;
end;
$$;

revoke execute on function create_role(uuid, text, text, text, boolean) from public, anon, authenticated;
revoke execute on function update_role(uuid, text, text) from public, anon, authenticated;
revoke execute on function delete_role(uuid) from public, anon, authenticated;
revoke execute on function grant_role_permission(uuid, uuid) from public, anon, authenticated;
revoke execute on function revoke_role_permission(uuid, uuid) from public, anon, authenticated;

grant execute on function create_role(uuid, text, text, text, boolean) to authenticated;
grant execute on function update_role(uuid, text, text) to authenticated;
grant execute on function delete_role(uuid) to authenticated;
grant execute on function grant_role_permission(uuid, uuid) to authenticated;
grant execute on function revoke_role_permission(uuid, uuid) to authenticated;
