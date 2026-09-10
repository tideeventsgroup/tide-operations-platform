begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

insert into public.internal_users (id, display_name, username, password_hash, role, is_active) values
  ('44444444-4444-4444-8444-444444444444', 'Incident manager', 'incident-manager-test', crypt(gen_random_uuid()::text, gen_salt('bf')), 'event_control', true),
  ('66666666-6666-4666-8666-666666666666', 'Incident reader', 'incident-reader-test', crypt(gen_random_uuid()::text, gen_salt('bf')), 'view_only', true);

insert into public.clients (id, name, display_reference)
values ('cddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Incident Test Client', 'CL-TST-INCIDENT');

insert into public.events (id, client_id, name, display_reference, timezone, starts_at, ends_at, created_by)
values ('eddddddd-dddd-4ddd-8ddd-dddddddddddd', 'cddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Incident Test Event', 'EVT-TST-INCIDENT', 'Europe/London', now(), now() + interval '1 hour', '44444444-4444-4444-8444-444444444444');

select results_eq(
  $$select created from public.create_incident_report(
    '44444444-4444-4444-8444-444444444444',
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'quick',
    null,
    'Medical assistance requested at the east gate.',
    'operator',
    '2026-09-07T16:00:00Z',
    null,
    null,
    null,
    null,
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

select is(
  (select count(*) from public.operational_outbox),
  1::bigint,
  'the report creates its transactional outbox message'
);

select results_eq(
  $$select created from public.create_incident_report(
    '44444444-4444-4444-8444-444444444444',
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'quick',
    null,
    'Medical assistance requested at the east gate.',
    'operator',
    '2026-09-07T16:00:00Z',
    null,
    null,
    null,
    null,
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

select throws_ok(
  $$select * from public.create_incident_report(
    '66666666-6666-4666-8666-666666666666',
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'quick',
    null,
    'This must not be recorded.',
    'operator',
    '2026-09-07T16:01:00Z',
    null,
    null,
    null,
    null,
    '77777777-7777-4777-8777-777777777777'
  )$$,
  '42501',
  'Incident creation is not permitted',
  'a view-only user cannot create an incident'
);

select is(
  (select count(*) from public.incidents),
  1::bigint,
  'a forbidden command does not partially create an incident'
);

select throws_ok(
  $$select * from public.create_incident_report(
    '44444444-4444-4444-8444-444444444444',
    'eddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'quick',
    null,
    repeat('x', 4001),
    'operator',
    '2026-09-07T16:02:00Z',
    null,
    null,
    null,
    null,
    '88888888-8888-4888-8888-888888888888'
  )$$,
  '22001',
  'The report content exceeds its character limit',
  'oversized initial reports are rejected'
);

select is(
  (select count(*) from public.incidents),
  1::bigint,
  'a validation failure does not partially create an incident'
);

select * from finish();

rollback;
