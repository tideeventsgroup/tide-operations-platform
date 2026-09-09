begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, aud, role, created_at, updated_at) values
  ('12121212-1212-4121-8121-121212121212', 'forms-manager@example.test', 'authenticated', 'authenticated', now(), now()),
  ('13131313-1313-4131-8131-131313131313', 'forms-operator@example.test', 'authenticated', 'authenticated', now(), now());
insert into public.profiles (id, display_name) values
  ('12121212-1212-4121-8121-121212121212', 'Forms manager'),
  ('13131313-1313-4131-8131-131313131313', 'Forms operator');
insert into public.organisations (id, name, slug, created_by)
values ('14141414-1414-4141-8141-141414141414', 'Forms Test Organisation', 'forms-test-organisation', '12121212-1212-4121-8121-121212121212');
insert into public.organisation_memberships (organisation_id, profile_id, role) values
  ('14141414-1414-4141-8141-141414141414', '12121212-1212-4121-8121-121212121212', 'event_control_manager'),
  ('14141414-1414-4141-8141-141414141414', '13131313-1313-4131-8131-131313131313', 'event_control_operator');
insert into public.clients (id, organisation_id, name, display_reference)
values ('15151515-1515-4151-8151-151515151515', '14141414-1414-4141-8141-141414141414', 'Forms Client', 'CL-TST-FORMS');
insert into public.events (id, organisation_id, client_id, name, display_reference, timezone, starts_at, ends_at, created_by)
values ('16161616-1616-4161-8161-161616161616', '14141414-1414-4141-8141-141414141414', '15151515-1515-4151-8151-151515151515', 'Forms Event', 'EVT-TST-FORMS', 'Europe/London', now(), now() + interval '1 hour', '12121212-1212-4121-8121-121212121212');
insert into public.event_access (event_id, organisation_id, profile_id, role, granted_by) values
  ('16161616-1616-4161-8161-161616161616', '14141414-1414-4141-8141-141414141414', '12121212-1212-4121-8121-121212121212', 'event_control_manager', '12121212-1212-4121-8121-121212121212'),
  ('16161616-1616-4161-8161-161616161616', '14141414-1414-4141-8141-141414141414', '13131313-1313-4131-8131-131313131313', 'event_control_operator', '12121212-1212-4121-8121-121212121212');

set local role authenticated;
set local request.jwt.claim.sub = '12121212-1212-4121-8121-121212121212';

select results_eq(
  $$select created from public.open_operational_period('16161616-1616-4161-8161-161616161616', 'Control opened.', '17171717-1717-4171-8171-171717171717')$$,
  $$values (true)$$,
  'a control manager can open one auditable Event Control period'
);

select results_eq(
  $$select created from public.open_operational_period('16161616-1616-4161-8161-161616161616', 'Control opened.', '17171717-1717-4171-8171-171717171717')$$,
  $$values (false)$$,
  'a retried opening returns the original receipt'
);

select lives_ok(
  $$select * from public.record_perimeter_check((select id from public.operational_periods), 'North gate', 'secure', 'Gate checked and clear.', '18181818-1818-4181-8181-181818181818')$$,
  'a control manager can append an immutable perimeter check'
);

select results_eq(
  $$select created from public.create_incident_report('16161616-1616-4161-8161-161616161616', 'Medical assistance requested.', '2026-09-07T16:00:00Z', '19191919-1919-4191-8191-191919191919')$$,
  $$values (true)$$,
  'the casualty test incident is created'
);

select lives_ok(
  $$select * from public.create_casualty_record((select id from public.incidents), 'C-01', 'requires_medical_assessment', 'Event medical', 'awaiting', 'Record needed to coordinate medical handover.', '20202020-2020-4202-8202-202020202020')$$,
  'a control manager can create a restricted, anonymous casualty coordination record'
);

select throws_ok(
  $$insert into public.casualty_records (organisation_id, event_id, incident_id, casualty_reference, condition_state, handover_status, recording_reason, recorded_by) select organisation_id, event_id, id, 'C-02', 'unknown', 'not_required', 'Direct write', '12121212-1212-4121-8121-121212121212' from public.incidents$$,
  '42501', null,
  'direct casualty writes are denied even to an authorised manager'
);

select results_eq(
  $$select version from public.close_operational_period((select id from public.operational_periods), 1, 'All core control records reviewed before close.', true, true, true, true, '23232323-2323-4232-8232-232323232323')$$,
  $$values (2)$$,
  'a manager can close Event Control only with every required review confirmed'
);

select throws_ok(
  $$select * from public.record_perimeter_check((select id from public.operational_periods), 'North gate', 'secure', null, '24242424-2424-4242-8242-242424242424')$$,
  '42501', 'Perimeter checks are not permitted for this operational period',
  'perimeter checks cannot be added after Event Control has closed'
);

set local request.jwt.claim.sub = '13131313-1313-4131-8131-131313131313';

select throws_ok(
  $$select * from public.create_casualty_record((select id from public.incidents), 'C-02', 'unknown', null, 'not_required', 'Operator access should be denied.', '21212121-2121-4212-8212-212121212121')$$,
  '42501', 'Restricted casualty record access is not permitted',
  'a control operator cannot create restricted casualty records'
);

select throws_ok(
  $$select * from public.open_operational_period('16161616-1616-4161-8161-161616161616', 'Second opening.', '22222222-2222-4222-8222-222222222222')$$,
  '42501', 'Operational period management is not permitted',
  'a control operator cannot open Event Control'
);

select * from finish();

rollback;
