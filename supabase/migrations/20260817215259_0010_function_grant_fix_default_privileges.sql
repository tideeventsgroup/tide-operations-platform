-- Root cause of 0007/0009 not fully sticking: the schema-reset migration
-- set `alter default privileges in schema public grant execute on
-- functions to anon, authenticated`, which grants EXECUTE directly to
-- those roles (not via the PUBLIC pseudo-role) on every function at
-- CREATE time. Revoking from PUBLIC never touched that direct grant.
-- Fix: revoke directly from anon/authenticated on the internal-only
-- functions, and stop the auto-grant for functions going forward —
-- explicit grants only, so this class of bug can't recur silently.

alter default privileges in schema public revoke execute on functions from anon, authenticated;

revoke execute on function guard_profile_sensitive_fields() from anon, authenticated;
revoke execute on function handle_new_auth_user() from anon, authenticated;
revoke execute on function next_reference(uuid, text, boolean, int) from anon, authenticated;
revoke execute on function record_audit_event(text, uuid, text, uuid, uuid, jsonb, jsonb, text) from anon, authenticated;
revoke execute on function current_profile_id() from anon, authenticated;
revoke execute on function current_organisation_id() from anon;
revoke execute on function is_staff() from anon;
revoke execute on function is_admin() from anon;
revoke execute on function has_permission(text, uuid, uuid, uuid) from anon;

-- Re-confirm the intentional grants (belt and braces, now explicit rather
-- than default-privilege-derived).
grant execute on function current_organisation_id() to authenticated;
grant execute on function is_staff() to authenticated;
grant execute on function is_admin() to authenticated;
grant execute on function has_permission(text, uuid, uuid, uuid) to authenticated;
