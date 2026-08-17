-- The 4 real auth.users rows predate this schema reset (auth.users was
-- deliberately preserved — only public schema data was wiped), so
-- on_auth_user_created never fired for them. Backfill profiles the same
-- way the trigger would, landing them as pending like any other account —
-- no special-casing, they go through the same admin-approval path.

insert into public.profiles (id, email, first_name, surname)
select
  u.id,
  u.email,
  split_part(u.raw_user_meta_data ->> 'full_name', ' ', 1),
  nullif(substring(u.raw_user_meta_data ->> 'full_name' from position(' ' in u.raw_user_meta_data ->> 'full_name') + 1), '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
