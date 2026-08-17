-- Consolidate overlapping permissive policies (advisor: multiple_permissive_policies)
-- and fix a real bug: column-level REVOKE on profiles blocked admins from
-- promoting anyone, since Postgres has no separate "admin" role to grant
-- those columns back to — everyone is `authenticated`. Replaced with a
-- trigger that checks is_admin() only when the sensitive columns change,
-- which correctly distinguishes self-edits from admin-privileged edits.

grant update on profiles to authenticated; -- re-grant column-level access removed in 0005; trigger below guards it

create function guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.account_type is distinct from old.account_type
      or new.organisation_id is distinct from old.organisation_id
      or new.status is distinct from old.status)
     and not is_admin() then
    raise exception 'Only an administrator can change account_type, organisation_id, or status';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_sensitive_fields
  before update on profiles
  for each row execute function guard_profile_sensitive_fields();

-- organisations: one SELECT policy, one write policy (admin only; creation
-- happens via service role / seed, not through the app).
drop policy organisations_select on organisations;
drop policy organisations_admin_all on organisations;

create policy organisations_select on organisations
  for select using ((is_staff() or is_admin()) and id = current_organisation_id());

create policy organisations_admin_update on organisations
  for update using (is_admin() and id = current_organisation_id())
  with check (is_admin() and id = current_organisation_id());

-- profiles: fold the admin "see everyone" case into the org-staff select
-- policy (admins already hold every permission, including user.view), and
-- fold self+admin into one UPDATE policy instead of two permissive ones.
drop policy profiles_select_self on profiles;
drop policy profiles_select_org_staff on profiles;
drop policy profiles_update_self on profiles;
drop policy profiles_admin_all on profiles;

create policy profiles_select on profiles
  for select using (
    id = (select auth.uid())
    or (is_staff() and organisation_id = current_organisation_id() and has_permission('user.view'))
  );

create policy profiles_update on profiles
  for update using (id = (select auth.uid()) or is_admin())
  with check (id = (select auth.uid()) or is_admin());

-- role_permissions: one SELECT policy covering both staff-read and
-- admin-write-implies-read (admin write policy already requires is_admin,
-- which is a superset of is_staff() in practice, but keep select explicit
-- and simple rather than relying on that).
drop policy role_permissions_select on role_permissions;
drop policy role_permissions_admin_write on role_permissions;

create policy role_permissions_select on role_permissions
  for select using (is_staff() or is_admin());

create policy role_permissions_insert on role_permissions
  for insert with check (is_admin());
create policy role_permissions_delete on role_permissions
  for delete using (is_admin());

-- user_roles: merge the three SELECT-producing policies into one, keep
-- write separate.
drop policy user_roles_select_self on user_roles;
drop policy user_roles_select_managers on user_roles;
drop policy user_roles_manage on user_roles;

create policy user_roles_select on user_roles
  for select using (
    user_id = (select auth.uid())
    or (organisation_id = current_organisation_id() and has_permission('user.view'))
  );

create policy user_roles_insert on user_roles
  for insert with check (organisation_id = current_organisation_id() and has_permission('user.administer'));
create policy user_roles_update on user_roles
  for update using (organisation_id = current_organisation_id() and has_permission('user.administer'))
  with check (organisation_id = current_organisation_id() and has_permission('user.administer'));
create policy user_roles_delete on user_roles
  for delete using (organisation_id = current_organisation_id() and has_permission('user.administer'));
