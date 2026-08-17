-- RLS is the access-control boundary (spec §3.2 / docs/architecture.md §6).

alter table organisations enable row level security;
alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table audit_logs enable row level security;
alter table id_counters enable row level security; -- no policies: locked to SECURITY DEFINER functions only

-- organisations: staff can see their own organisation; admins can manage it.
create policy organisations_select on organisations
  for select using (is_staff() and id = current_organisation_id());

create policy organisations_admin_all on organisations
  for all using (is_admin() and id = current_organisation_id())
  with check (is_admin() and id = current_organisation_id());

-- profiles: everyone can read/update their own row (not account_type —
-- enforced by column-level revoke below); staff with user.view can read
-- profiles in their organisation; admins can manage.
create policy profiles_select_self on profiles
  for select using (id = auth.uid());

create policy profiles_select_org_staff on profiles
  for select using (is_staff() and organisation_id = current_organisation_id() and has_permission('user.view'));

create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

revoke update (account_type, organisation_id, status) on profiles from authenticated;

-- roles / permissions / role_permissions: readable by any signed-in staff
-- (UI needs role names); mutation restricted to admins.
create policy roles_select on roles
  for select using (is_staff() and (organisation_id is null or organisation_id = current_organisation_id()));

create policy roles_admin_write on roles
  for insert with check (is_admin());
create policy roles_admin_update on roles
  for update using (is_admin()) with check (is_admin());
create policy roles_admin_delete on roles
  for delete using (is_admin() and organisation_id = current_organisation_id());

create policy permissions_select on permissions
  for select using (is_staff());

create policy role_permissions_select on role_permissions
  for select using (is_staff());
create policy role_permissions_admin_write on role_permissions
  for all using (is_admin()) with check (is_admin());

-- user_roles: a user can see their own grants; admins/user-managers can see
-- and manage grants within their organisation.
create policy user_roles_select_self on user_roles
  for select using (user_id = auth.uid());

create policy user_roles_select_managers on user_roles
  for select using (organisation_id = current_organisation_id() and has_permission('user.view'));

create policy user_roles_manage on user_roles
  for all using (organisation_id = current_organisation_id() and has_permission('user.administer'))
  with check (organisation_id = current_organisation_id() and has_permission('user.administer'));

-- audit_logs: read-only for those with audit.view; no direct write policy
-- for anyone — rows are written exclusively via record_audit_event().
create policy audit_logs_select on audit_logs
  for select using (organisation_id = current_organisation_id() and has_permission('audit.view'));
