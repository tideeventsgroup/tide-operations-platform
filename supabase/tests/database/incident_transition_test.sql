begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email, aud, role, created_at, updated_at)
values ('99999999-9999-4999-8999-999999999999', 'transition-manager@example.test', 'authenticated', 'authenticated', now(), now());

insert into public.profiles (id, display_name)
values ('99999999-9999-4999-8999-999999999999', 'Transition manager');

insert into public.organisations (id, name, slug, created_by)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Transition Test Organisation', 'transition-test-organisation', '99999999-9999-4999-8999-999999999999');

insert into public.organisation_memberships (organisation_id, profile_id, role)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '99999999-9999-4999-8999-999999999999', 'event_control_manager');

insert into public.clients (id, organisation_id, name, display_reference)
values ('ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Transition Test Client', 'CL-TST-TRANSITION');

insert into public.events (id, organisation_id, client_id, name, display_reference, timezone, starts_at, ends_at, created_by)
values ('efffffff-ffff-4fff-8fff-ffffffffffff', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Transition Test Event', 'EVT-TST-TRANSITION', 'Europe/London', now(), now() + interval '1 hour', '99999999-9999-4999-8999-999999999999');

insert into public.event_access (event_id, organisation_id, profile_id, role, granted_by)
values ('efffffff-ffff-4fff-8fff-ffffffffffff', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '99999999-9999-4999-8999-999999999999', 'event_control_manager', '99999999-9999-4999-8999-999999999999');

set local role authenticated;
set local request.jwt.claim.sub = '99999999-9999-4999-8999-999999999999';

select results_eq(
  $$select created from public.create_incident_report(
    'efffffff-ffff-4fff-8fff-ffffffffffff', 'Initial report.', '2026-09-07T16:00:00Z', 'aaaaaaaa-1111-4111-8111-111111111111'
  )$$,
  $$values (true)$$,
  'the transition fixture incident is created'
);

select results_eq(
  $$select version from public.transition_incident(
    (select id from public.incidents), 1, 'assessing', 'high', 'Initial assessment completed.', 'bbbbbbbb-2222-4222-8222-222222222222'
  )$$,
  $$values (2)$$,
  'a permitted received-to-assessing transition advances the version'
);

select results_eq(
  $$select status, severity, version from public.incidents$$,
  $$values ('assessing'::text, 'high'::text, 2)$$,
  'the incident projection reflects the lifecycle and severity change'
);

select results_eq(
  $$select previous_status, new_status, previous_severity, new_severity from public.incident_transitions$$,
  $$values ('received'::text, 'assessing'::text, 'unknown'::text, 'high'::text)$$,
  'the immutable transition retains both before and after values'
);

select is(
  (select count(*) from public.incident_timeline_entries),
  2::bigint,
  'the transition appends a second timeline entry'
);

select results_eq(
  $$select created from public.transition_incident(
    (select id from public.incidents), 1, 'assessing', 'high', 'Initial assessment completed.', 'bbbbbbbb-2222-4222-8222-222222222222'
  )$$,
  $$values (false)$$,
  'a retry returns the original transition receipt'
);

select throws_ok(
  $$select * from public.transition_incident(
    (select id from public.incidents), 1, 'active', null, 'This stale command must fail.', 'cccccccc-3333-4333-8333-333333333333'
  )$$,
  '40001',
  'Incident has changed since it was opened',
  'a stale lifecycle command is rejected'
);

select is(
  (select count(*) from public.incident_transitions),
  1::bigint,
  'a stale command leaves the immutable transition history unchanged'
);

select * from finish();

rollback;
