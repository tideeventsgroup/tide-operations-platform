insert into permissions (code, module, action, description) values
  ('site_audit.manage', 'site_audit', 'manage', 'Create and configure audit templates'),
  ('site_audit.submit', 'site_audit', 'submit', 'Complete and submit audits'),
  ('site_audit.view', 'site_audit', 'view', 'View all audit submissions and scores');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('site_audit.manage', 'site_audit.submit', 'site_audit.view')
where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('site_audit.submit', 'site_audit.view')
where r.code in ('event_control_manager', 'security_manager', 'stewarding_manager', 'medical_manager', 'team_leader',
                 'event_controller', 'deputy_controller');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'site_audit.view'
where r.code in ('managing_director', 'operations_director', 'event_director', 'event_safety_manager', 'read_only_auditor');
