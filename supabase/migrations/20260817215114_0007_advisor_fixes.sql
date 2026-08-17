-- Corrections from the post-migration security/performance advisor pass.

-- 1. pg_trgm does not belong in the public (PostgREST-exposed) schema.
create schema if not exists extensions;
drop extension if exists pg_trgm;
create extension pg_trgm with schema extensions;

-- 2. Internal-only functions should not be callable as public RPCs.
--    handle_new_auth_user is a trigger function only; next_reference and
--    record_audit_event are meant to be called from other SECURITY DEFINER
--    functions / trusted server code, not invoked directly by a client.
--    Trigger firing does not depend on EXECUTE grants, so this does not
--    break the on_auth_user_created trigger.
revoke execute on function handle_new_auth_user() from public, anon, authenticated;
revoke execute on function next_reference(uuid, text, boolean, int) from public, anon, authenticated;
revoke execute on function record_audit_event(text, uuid, text, uuid, uuid, jsonb, jsonb, text) from public, anon, authenticated;

-- Read-only status/permission checks are fine for authenticated (they only
-- ever reveal information about the caller), but have no legitimate anon use.
revoke execute on function current_profile_id() from anon;
revoke execute on function current_organisation_id() from anon;
revoke execute on function is_staff() from anon;
revoke execute on function is_admin() from anon;
revoke execute on function has_permission(text, uuid, uuid, uuid) from anon;

-- current_profile_id() duplicates auth.uid() with no added value client-side.
revoke execute on function current_profile_id() from authenticated;

-- 3. Cover the unindexed foreign keys the advisor flagged.
create index audit_logs_actor_id_idx on audit_logs (actor_id);
create index role_permissions_permission_id_idx on role_permissions (permission_id);
create index user_roles_granted_by_idx on user_roles (granted_by);
create index user_roles_revoked_by_idx on user_roles (revoked_by);
create index user_roles_role_id_idx on user_roles (role_id);
