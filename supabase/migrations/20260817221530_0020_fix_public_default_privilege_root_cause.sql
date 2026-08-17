-- Real root cause of the recurring "new function is anon-executable" issue
-- (0007, 0009, 0010, and now the Phase 2 functions): Postgres grants
-- EXECUTE to the PUBLIC pseudo-role on every new function by default,
-- independent of any default-privilege ACL entry — and every role,
-- including anon/authenticated, inherits PUBLIC grants. 0010 only revoked
-- the default privilege *for anon/authenticated specifically*, which
-- doesn't touch this. Revoke PUBLIC's default execute here so no future
-- CREATE FUNCTION needs a manual follow-up revoke.
--
-- Note (see docs/architecture.md §6): even this default-privilege REVOKE
-- was empirically found not to reliably suppress the PUBLIC grant on
-- functions created in later migrations. The standing rule going forward
-- is an explicit revoke+grant immediately after every CREATE FUNCTION —
-- this migration is kept as belt-and-braces, not as the sole safeguard.

alter default privileges in schema public revoke execute on functions from public;

-- Clean up every function created since, explicitly.
revoke execute on function set_client_reference() from public, anon, authenticated;
revoke execute on function set_event_reference() from public, anon, authenticated;
revoke execute on function prevent_reference_update() from public, anon, authenticated;
revoke execute on function change_event_stage(uuid, event_lifecycle_stage, text) from public, anon;
revoke execute on function activate_event(uuid, text, text[]) from public, anon;
revoke execute on function change_event_phase(uuid, event_phase) from public, anon;

-- Re-confirm the intentional authenticated grants (explicit, not default-derived).
grant execute on function change_event_stage(uuid, event_lifecycle_stage, text) to authenticated;
grant execute on function activate_event(uuid, text, text[]) to authenticated;
grant execute on function change_event_phase(uuid, event_phase) to authenticated;
