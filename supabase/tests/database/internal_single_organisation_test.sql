begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select ok(to_regclass('public.internal_users') is not null, 'internal users table exists');
select ok(to_regclass('public.organisations') is null, 'organisation table is removed');
select ok(to_regclass('public.organisation_memberships') is null, 'membership table is removed');
select ok(to_regclass('public.event_access') is null, 'event-access table is removed');

select is(
  (select count(*) from information_schema.columns where table_schema = 'public' and column_name = 'organisation_id'),
  0::bigint,
  'no public table retains organisation scoping'
);

select ok(
  exists (select 1 from pg_class where oid = 'public.internal_users'::regclass and relrowsecurity),
  'internal users retain deny-by-default RLS'
);

select is(
  (select count(*) from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated')),
  0::bigint,
  'public Data API roles have no table grants'
);

select ok(
  exists (select 1 from public.internal_users where username is not null and password_hash is not null),
  'migrated users retain a username and bcrypt password hash'
);

select * from finish();

rollback;
