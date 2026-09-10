begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into public.internal_users (id, display_name, username, password_hash, role, is_active) values
  ('12121212-1212-4121-8121-121212121212', 'Forms manager', 'forms-manager-test', crypt(gen_random_uuid()::text, gen_salt('bf')), 'event_control', true),
  ('13131313-1313-4131-8131-131313131313', 'Forms operator', 'forms-operator-test', crypt(gen_random_uuid()::text, gen_salt('bf')), 'staff', true);

insert into public.clients (id, name, display_reference)
values ('15151515-1515-4151-8151-151515151515', 'Forms Client', 'CL-TST-FORMS');

insert into public.events (id, client_id, name, display_reference, timezone, starts_at, ends_at, created_by)
values ('16161616-1616-4161-8161-161616161616', '15151515-1515-4151-8151-151515151515', 'Forms Event', 'EVT-TST-FORMS', 'Europe/London', now(), now() + interval '1 hour', '12121212-1212-4121-8121-121212121212');

select results_eq(
  $$select created from public.open_operational_period('12121212-1212-4121-8121-121212121212', '16161616-1616-4161-8161-161616161616', 'Control opened.', '17171717-1717-4171-8171-171717171717')$$,
  $$values (true)$$,
  'a control manager can open one auditable Event Control period'
);

select results_eq(
  $$select created from public.open_operational_period('12121212-1212-4121-8121-121212121212', '16161616-1616-4161-8161-161616161616', 'Control opened.', '17171717-1717-4171-8171-171717171717')$$,
  $$values (false)$$,
  'a retried opening returns the original receipt'
);

select lives_ok(
  $$select * from public.record_perimeter_check('12121212-1212-4121-8121-121212121212', (select id from public.operational_periods), 'North gate', 'secure', 'Gate checked and clear.', '18181818-1818-4181-8181-181818181818')$$,
  'a control manager can append an immutable perimeter check'
);

select results_eq(
  $$select created from public.create_incident_report('12121212-1212-4121-8121-121212121212', '16161616-1616-4161-8161-161616161616', 'quick', null, 'Medical assistance requested.', 'operator', '2026-09-07T16:00:00Z', null, null, null, null, '19191919-1919-4191-8191-191919191919')$$,
  $$values (true)$$,
  'the casualty test incident is created'
);

select lives_ok(
  $$select * from public.create_casualty_record('12121212-1212-4121-8121-121212121212', (select id from public.incidents), 'C-01', 'requires_medical_assessment', 'Event medical', 'awaiting', 'Record needed to coordinate medical handover.', '20202020-2020-4202-8202-202020202020')$$,
  'a control manager can create a restricted, anonymous casualty coordination record'
);

set local role authenticated;

select throws_ok(
  $$insert into public.casualty_records (event_id, incident_id, casualty_reference, condition_state, handover_status, recording_reason, recorded_by) select event_id, id, 'C-02', 'unknown', 'not_required', 'Direct write', '12121212-1212-4121-8121-121212121212' from public.incidents$$,
  '42501', null,
  'direct casualty writes are denied even to an authorised manager'
);

reset role;

select results_eq(
  $$select version from public.close_operational_period('12121212-1212-4121-8121-121212121212', (select id from public.operational_periods), 1, 'All core control records reviewed before close.', true, true, true, true, '23232323-2323-4232-8232-232323232323')$$,
  $$values (2)$$,
  'a manager can close Event Control only with every required review confirmed'
);

select throws_ok(
  $$select * from public.record_perimeter_check('12121212-1212-4121-8121-121212121212', (select id from public.operational_periods), 'North gate', 'secure', null, '24242424-2424-4242-8242-242424242424')$$,
  '42501', 'Perimeter checks are not permitted for this operational period',
  'perimeter checks cannot be added after Event Control has closed'
);

select throws_ok(
  $$select * from public.create_casualty_record('13131313-1313-4131-8131-131313131313', (select id from public.incidents), 'C-02', 'unknown', null, 'not_required', 'Operator access should be denied.', '21212121-2121-4212-8212-212121212121')$$,
  '42501', 'Restricted casualty record access is not permitted',
  'an operator without casualty capability cannot create restricted casualty records'
);

select throws_ok(
  $$select * from public.open_operational_period('13131313-1313-4131-8131-131313131313', '16161616-1616-4161-8161-161616161616', 'Second opening.', '22222222-2222-4222-8222-222222222222')$$,
  '42501', 'Operational period management is not permitted',
  'an operator without period capability cannot open Event Control'
);

select * from finish();

rollback;
