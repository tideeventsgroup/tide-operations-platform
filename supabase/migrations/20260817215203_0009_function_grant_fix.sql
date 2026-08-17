-- The 0007 revokes only stripped anon/authenticated grants, but Postgres
-- grants EXECUTE to the PUBLIC pseudo-role by default on function creation,
-- and every role (including anon/authenticated) inherits PUBLIC grants
-- regardless of a direct per-role REVOKE. Fix properly: revoke from PUBLIC,
-- then grant back only to the roles that should actually call each function.

revoke execute on function current_profile_id() from public;
revoke execute on function current_organisation_id() from public;
revoke execute on function is_staff() from public;
revoke execute on function is_admin() from public;
revoke execute on function has_permission(text, uuid, uuid, uuid) from public;
revoke execute on function guard_profile_sensitive_fields() from public;
revoke execute on function handle_new_auth_user() from public;
revoke execute on function next_reference(uuid, text, boolean, int) from public;
revoke execute on function record_audit_event(text, uuid, text, uuid, uuid, jsonb, jsonb, text) from public;

-- Signed-in users may call these directly (e.g. conditional UI rendering);
-- current_profile_id/guard_profile_sensitive_fields/handle_new_auth_user/
-- next_reference/record_audit_event stay internal-only (no grant at all).
grant execute on function current_organisation_id() to authenticated;
grant execute on function is_staff() to authenticated;
grant execute on function is_admin() to authenticated;
grant execute on function has_permission(text, uuid, uuid, uuid) to authenticated;
