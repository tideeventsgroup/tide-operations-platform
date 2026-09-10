begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into public.internal_users (id, display_name, username, password_hash, role, is_active)
values ('99999999-9999-4999-8999-999999999999', 'Transition manager', 'transition-manager-test', crypt(gen_random_uuid()::text, gen_salt('bf')), 'event_control', true);

insert into public.clients (id, name, display_reference)
values ('ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Transition Test Client', 'CL-TST-TRANSITION');

insert into public.events (id, client_id, name, display_reference, timezone, starts_at, ends_at, created_by)
values ('efffffff-ffff-4fff-8fff-ffffffffffff', 'ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Transition Test Event', 'EVT-TST-TRANSITION', 'Europe/London', now(), now() + interval '1 hour', '99999999-9999-4999-8999-999999999999');

select results_eq(
  $$select created from public.create_incident_report(
    '99999999-9999-4999-8999-999999999999', 'efffffff-ffff-4fff-8fff-ffffffffffff', 'quick', null,
    'Initial report.', 'operator', '2026-09-07T16:00:00Z', null, null, null, null, 'aaaaaaaa-1111-4111-8111-111111111111'
  )$$,
  $$values (true)$$,
  'the transition fixture incident is created'
);

select results_eq(
  $$select version from public.transition_incident(
    '99999999-9999-4999-8999-999999999999', (select id from public.incidents), 1, 'assessing', 'high', 'Initial assessment completed.', 'bbbbbbbb-2222-4222-8222-222222222222'
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
    '99999999-9999-4999-8999-999999999999', (select id from public.incidents), 1, 'assessing', 'high', 'Initial assessment completed.', 'bbbbbbbb-2222-4222-8222-222222222222'
  )$$,
  $$values (false)$$,
  'a retry returns the original transition receipt'
);

select throws_ok(
  $$select * from public.transition_incident(
    '99999999-9999-4999-8999-999999999999', (select id from public.incidents), 1, 'active', null, 'This stale command must fail.', 'cccccccc-3333-4333-8333-333333333333'
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
