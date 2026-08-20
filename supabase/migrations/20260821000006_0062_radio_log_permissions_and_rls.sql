insert into permissions (code, module, action, description) values
  ('radio_log.create', 'radio_log', 'create', 'Log radio/comms traffic'),
  ('radio_log.view', 'radio_log', 'view', 'View the radio log');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('radio_log.create', 'radio_log.view')
where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('radio_log.create', 'radio_log.view')
where r.code in ('event_control_manager', 'event_controller', 'deputy_controller', 'security_manager',
                 'medical_manager', 'stewarding_manager', 'team_leader');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'radio_log.view'
where r.code in ('event_safety_manager', 'event_director', 'managing_director', 'operations_director', 'read_only_auditor');

alter table radio_log_entries enable row level security;

create policy radio_log_entries_select on radio_log_entries
  for select using (has_permission('radio_log.view', organisation_id, null, event_id));
