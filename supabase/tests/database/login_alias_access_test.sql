begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id, email, aud, role, created_at, updated_at)
values (
  '44444444-4444-4444-8444-444444444444',
  'owner@example.test',
  'authenticated',
  'authenticated',
  now(),
  now()
);

insert into public.profiles (id, display_name)
values ('44444444-4444-4444-8444-444444444444', 'Owner user');

insert into public.login_aliases (username, profile_id)
values ('owner.user', '44444444-4444-4444-8444-444444444444');

select lives_ok(
  $$select 1 from public.login_aliases where username = 'owner.user'$$,
  'the database owner can provision a normalised login alias'
);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';

select throws_ok(
  $$select * from public.login_aliases$$,
  '42501',
  null,
  'authenticated clients cannot read the login alias directory'
);

select throws_ok(
  $$insert into public.login_aliases (username, profile_id) values ('other.user', '44444444-4444-4444-8444-444444444444')$$,
  '42501',
  null,
  'authenticated clients cannot change login aliases'
);

select * from finish();

rollback;
