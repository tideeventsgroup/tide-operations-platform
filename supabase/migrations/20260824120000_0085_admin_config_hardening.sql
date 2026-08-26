-- characteristic_types gains the same shape as event_categories so the
-- admin UI can order it and mark the seeded rows as undeletable.
alter table characteristic_types
  add column is_system boolean not null default false,
  add column sort_order integer not null default 0;

update characteristic_types set is_system = true;

-- Every write to this config surface now goes through a guarded
-- SECURITY DEFINER function (added in the migrations that follow). These
-- broad direct-write policies let any admin bypass the in-use guards
-- entirely via a direct PostgREST call — role_permissions_delete and
-- roles_admin_update in particular have no organisation scope and no
-- protection for the seeded system roles, so an admin could strip
-- organisation.administer from the global admin role and lock every
-- admin out permanently. Nothing in the application writes to these
-- tables directly (verified), so dropping the policies breaks no caller.
-- SECURITY DEFINER functions run as the table owner and are unaffected
-- by these drops; SELECT policies are untouched.
drop policy role_permissions_insert on role_permissions;
drop policy role_permissions_delete on role_permissions;
drop policy roles_admin_write on roles;
drop policy roles_admin_update on roles;
drop policy roles_admin_delete on roles;
drop policy document_types_admin_write on document_types;
drop policy incident_priorities_admin_write on event_priorities;
drop policy event_control_roles_admin_write on operation_control_roles;
drop policy organisations_admin_update on organisations;
