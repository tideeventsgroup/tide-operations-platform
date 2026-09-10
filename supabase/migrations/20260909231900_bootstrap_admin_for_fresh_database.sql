-- The SOF26 seed migration (20260909232000) requires an active internal
-- administrator to attribute the seeded client/event to. On the real Sential
-- database that administrator already exists (carried forward from Supabase
-- Auth by 20260909230000). On a genuinely fresh database - a new checkout,
-- CI, or a rebuilt local dev stack - no internal_users row exists yet and
-- the seed would fail outright, making the migration chain unreproducible.
--
-- This creates a placeholder admin only when no admin exists. The password
-- hash is derived from a random UUID that is discarded immediately, so the
-- account has no usable credential; it exists purely to satisfy the seed's
-- attribution requirement on empty databases. It is a no-op wherever a real
-- administrator is already present.

insert into public.internal_users (id, display_name, username, password_hash, role, is_active)
select
  gen_random_uuid(),
  'Bootstrap Administrator',
  'bootstrap-admin',
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  'admin',
  true
where not exists (
  select 1 from public.internal_users where role = 'admin' and is_active
);
