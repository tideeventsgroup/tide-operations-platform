begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'admin-alpha@example.test', 'authenticated', 'authenticated', now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'operator-alpha@example.test', 'authenticated', 'authenticated', now(), now()),
  ('33333333-3333-4333-8333-333333333333', 'admin-bravo@example.test', 'authenticated', 'authenticated', now(), now());

insert into public.profiles (id, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'Alpha administrator'),
  ('22222222-2222-4222-8222-222222222222', 'Alpha operator'),
  ('33333333-3333-4333-8333-333333333333', 'Bravo administrator');

insert into public.organisations (id, name, slug, created_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alpha Operations', 'alpha-operations-test', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bravo Operations', 'bravo-operations-test', '33333333-3333-4333-8333-333333333333');

insert into public.organisation_memberships (organisation_id, profile_id, role)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'organisation_admin'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'event_control_operator'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 'organisation_admin');

insert into public.clients (id, organisation_id, name, display_reference)
values
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alpha client', 'CL-TST-ALPHA'),
  ('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bravo client', 'CL-TST-BRAVO');

insert into public.events (id, organisation_id, client_id, name, display_reference, timezone, starts_at, ends_at, created_by)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alpha live event', 'EVT-TST-ALPHA-1', 'Europe/London', now(), now() + interval '1 hour', '11111111-1111-4111-8111-111111111111'),
  ('eaaa0000-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alpha restricted event', 'EVT-TST-ALPHA-2', 'Europe/London', now(), now() + interval '1 hour', '11111111-1111-4111-8111-111111111111'),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bravo live event', 'EVT-TST-BRAVO-1', 'Europe/London', now(), now() + interval '1 hour', '33333333-3333-4333-8333-333333333333');

insert into public.event_access (event_id, organisation_id, profile_id, role, granted_by)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'event_control_operator', '11111111-1111-4111-8111-111111111111');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select is(
  (select count(*) from public.events),
  2::bigint,
  'an organisation administrator can see only their own organisation events'
);

select is_empty(
  $$select 1 from public.events where id = 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  'an organisation administrator cannot see another tenant event'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select id from public.events order by id$$,
  $$values ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)$$,
  'an event operator sees only their explicit event assignment'
);

select is_empty(
  $$update public.events set name = 'tampered' where id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id$$,
  'an event operator cannot overwrite an event record'
);

set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

select results_eq(
  $$select id from public.events order by id$$,
  $$values ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)$$,
  'the second tenant cannot see Alpha events'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select is_empty(
  $$delete from public.events where id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id$$,
  'event records are not deletable through the authenticated API'
);

select * from finish();

rollback;
