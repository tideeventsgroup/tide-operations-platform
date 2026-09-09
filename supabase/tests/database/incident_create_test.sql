begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('44444444-4444-4444-8444-444444444444', 'incident-manager@example.test', 'authenticated', 'authenticated', now(), now()),
  ('66666666-6666-4666-8666-666666666666', 'incident-reader@example.test', 'authenticated', 'authenticated', now(), now());

insert into public.profiles (id, display_name)
values
  ('44444444-4444-4444-8444-444444444444', 'Incident manager'),
  ('66666666-6666-4666-8666-666666666666', 'Incident reader');

insert into public.organisations (id, name, slug, created_by)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Incident Test Organisation', 'incident-test-organisation', '44444444-4444-4444-8444-444444444444');

insert into public.organisation_memberships (organisation_id, profile_id, role)
values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '44444444-4444-4444-8444-444444444444', 'event_control_manager'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '66666666-6666-4666-8666-666666666666', 'read_only');

insert into public.clients (id, organisation_id, name, display_reference)
values ('cddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Incident Test Client', 'CL-TST-INCIDENT');

insert into public.events (id, organisation_id, client_id, name, display_reference, timezone, starts_at, ends_at, created_by)
values ('eddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'cddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Incident Test Event', 'EVT-TST-INCIDENT', 'Europe/London', now(), now() + interval '1 hour', '44444444-4444-4444-8444-444444444444');

insert into public.event_access (event_id, organisation_id, profile_id, role, granted_by)
values
  ('eddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '44444444-4444-4444-8444-444444444444', 'event_control_manager', '44444444-4444-4444-8444-444444444444'),
  ('eddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '66666666-6666-4666-8666-666666666666', 'read_only', '44444444-4444-4444-8444-444444444444');

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';

select results_eq(
  $$select created from public.create_incident_report(
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Medical assistance requested at the east gate.',
    '2026-09-07T16:00:00Z',
    '55555555-5555-4555-8555-555555555555'
  )$$,
  $$values (true)$$,
  'the first report command creates an incident'
);

select results_eq(
  $$select display_reference from public.incidents$$,
  $$values ('INC-TST-INCIDENT-0001'::text)$$,
  'the incident receives an event-local human reference'
);

select is(
  (select count(*) from public.incident_timeline_entries),
  1::bigint,
  'the report creates its initial immutable timeline entry'
);

select is(
  (select count(*) from public.incident_audit_events),
  1::bigint,
  'the report creates its audit event'
);

reset role;

select is(
  (select count(*) from public.operational_outbox),
  1::bigint,
  'the report creates its transactional outbox message'
);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';

select results_eq(
  $$select created from public.create_incident_report(
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Medical assistance requested at the east gate.',
    '2026-09-07T16:00:00Z',
    '55555555-5555-4555-8555-555555555555'
  )$$,
  $$values (false)$$,
  'a retry with the same idempotency key returns the original receipt'
);

select is(
  (select count(*) from public.incidents),
  1::bigint,
  'an idempotent retry does not create a duplicate incident'
);

set local request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';

select throws_ok(
  $$select * from public.create_incident_report(
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'This must not be recorded.',
    '2026-09-07T16:01:00Z',
    '77777777-7777-4777-8777-777777777777'
  )$$,
  '42501',
  'Incident creation is not permitted for this event',
  'a read-only event user cannot create an incident'
);

select is(
  (select count(*) from public.incidents),
  1::bigint,
  'a forbidden command does not partially create an incident'
);

set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';

select throws_ok(
  $$select * from public.create_incident_report(
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    repeat('x', 4001),
    '2026-09-07T16:02:00Z',
    '88888888-8888-4888-8888-888888888888'
  )$$,
  '22001',
  'Initial report exceeds the 4000 character limit',
  'oversized initial reports are rejected'
);

select is(
  (select count(*) from public.incidents),
  1::bigint,
  'a validation failure does not partially create an incident'
);

select * from finish();

rollback;
