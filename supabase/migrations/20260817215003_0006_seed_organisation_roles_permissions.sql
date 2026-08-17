-- Seed the Tide org and an initial permission/role catalog. Extensible —
-- more permissions land as each module (document, risk, planning...) is built.

insert into organisations (code, name, legal_name)
values ('TEG', 'Tide Events Group Scotland', 'Tide Events Group Scotland');

insert into permissions (code, module, action, description) values
  ('organisation.administer', 'organisation', 'administer', 'Manage organisation settings, roles, and users'),
  ('user.view', 'user', 'view', 'View staff/user profiles and role grants'),
  ('user.administer', 'user', 'administer', 'Promote accounts and grant/revoke roles'),
  ('audit.view', 'audit', 'view', 'View the audit log'),
  ('client.view', 'client', 'view', 'View client records'),
  ('client.create', 'client', 'create', 'Create client records'),
  ('client.update', 'client', 'update', 'Edit client records'),
  ('client.administer', 'client', 'administer', 'Archive/manage client records'),
  ('event.view', 'event', 'view', 'View event records'),
  ('event.create', 'event', 'create', 'Create events'),
  ('event.update', 'event', 'update', 'Edit event records'),
  ('event.administer', 'event', 'administer', 'Manage event lifecycle and structure'),
  ('event.activate', 'event', 'activate', 'Activate an event to Live'),
  ('incident.view', 'incident', 'view', 'View incident records (non-restricted fields)'),
  ('incident.create', 'incident', 'create', 'Report incidents'),
  ('incident.update', 'incident', 'update', 'Update incidents, append timeline entries'),
  ('incident.assign', 'incident', 'assign', 'Assign controller/owner, dispatch resources'),
  ('incident.resolve', 'incident', 'resolve', 'Resolve incidents'),
  ('incident.close', 'incident', 'close', 'Close incidents'),
  ('incident.reopen', 'incident', 'reopen', 'Reopen closed incidents'),
  ('incident.view_restricted', 'incident', 'view_restricted', 'View restricted welfare/medical/safeguarding detail'),
  ('incident.export', 'incident', 'export', 'Export incident reports'),
  ('document.view', 'document', 'view', 'View documents'),
  ('document.create', 'document', 'create', 'Create/upload documents'),
  ('document.update', 'document', 'update', 'Edit draft documents'),
  ('document.approve', 'document', 'approve', 'Approve documents for issue'),
  ('document.issue', 'document', 'issue', 'Issue approved documents'),
  ('document.administer', 'document', 'administer', 'Manage document types and templates');

-- Internal (staff) roles — spec §18.
insert into roles (code, name, is_system, is_external) values
  ('admin', 'Platform Administrator', true, false),
  ('managing_director', 'Managing Director', true, false),
  ('operations_director', 'Operations Director', true, false),
  ('event_director', 'Event Director', true, false),
  ('event_safety_manager', 'Event Safety Manager', true, false),
  ('event_control_manager', 'Event Control Manager', true, false),
  ('event_controller', 'Event Controller', true, false),
  ('deputy_controller', 'Deputy Controller', true, false),
  ('security_manager', 'Security Manager', true, false),
  ('medical_manager', 'Medical Manager', true, false),
  ('stewarding_manager', 'Stewarding Manager', true, false),
  ('team_leader', 'Team Leader', true, false),
  ('field_reporter', 'Field Reporter', true, false),
  ('document_manager', 'Document Manager', true, false),
  ('risk_manager', 'Risk Manager', true, false),
  ('client_manager', 'Client Manager', true, false),
  ('read_only_auditor', 'Read Only Auditor', true, false);

-- External roles — spec §19.
insert into roles (code, name, is_system, is_external) values
  ('client_administrator', 'Client Administrator', true, true),
  ('client_reviewer', 'Client Reviewer', true, true),
  ('client_viewer', 'Client Viewer', true, true),
  ('contractor', 'Contractor', true, true),
  ('supplier', 'Supplier', true, true),
  ('external_agency_viewer', 'External Agency Viewer', true, true),
  ('temporary_reporter', 'Temporary Reporter', true, true);

-- Grants. admin gets everything; others get a sensible starting set that
-- expands as later phases add modules.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('client.view','client.create','client.update','client.administer',
                'event.view','event.create','event.update','event.administer','event.activate',
                'incident.view','incident.view_restricted','incident.export',
                'document.view','document.approve','document.issue',
                'user.view','audit.view')
where r.code in ('managing_director','operations_director');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','event.update','incident.view','incident.view_restricted','document.approve','document.view')
where r.code = 'event_director';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','incident.view','incident.view_restricted','document.approve','document.view')
where r.code = 'event_safety_manager';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','incident.view','incident.create','incident.update','incident.assign',
                'incident.resolve','incident.close','incident.reopen','incident.view_restricted','incident.export')
where r.code = 'event_control_manager';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','incident.view','incident.create','incident.update','incident.assign',
                'incident.resolve','incident.view_restricted')
where r.code in ('event_controller','deputy_controller');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','incident.view','incident.create','incident.update','incident.view_restricted')
where r.code in ('security_manager','medical_manager');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','incident.view','incident.create','incident.update')
where r.code = 'stewarding_manager';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','incident.view','incident.create')
where r.code = 'team_leader';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('incident.create')
where r.code in ('field_reporter','temporary_reporter');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('document.view','document.create','document.update','document.approve','document.issue','document.administer')
where r.code = 'document_manager';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view')
where r.code = 'risk_manager';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('client.view','client.create','client.update','event.view')
where r.code = 'client_manager';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('incident.view','document.view','event.view','client.view','audit.view')
where r.code = 'read_only_auditor';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('event.view','document.view')
where r.code in ('client_administrator','client_reviewer','client_viewer','contractor','supplier');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('incident.view')
where r.code = 'external_agency_viewer';
