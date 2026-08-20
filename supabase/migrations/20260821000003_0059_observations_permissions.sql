-- observation.create is deliberately as broad as incident.create — the
-- whole point of observations is that anyone who can report an incident
-- can also log a lower-friction observation. observation.view/manage stay
-- internal-only (no external/client role gets them): observations aren't
-- client-facing reporting, they're the control room's own situational
-- noting. Per the standing rule: grant admin in the SAME migration as the
-- new permissions row.
insert into permissions (code, module, action, description) values
  ('observation.create', 'observation', 'create', 'Log observation reports'),
  ('observation.view', 'observation', 'view', 'View observation reports'),
  ('observation.manage', 'observation', 'manage', 'Review, dismiss, and promote observations to incidents');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('observation.create', 'observation.view', 'observation.manage')
where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('observation.create', 'observation.view', 'observation.manage')
where r.code in ('event_control_manager', 'event_controller', 'deputy_controller', 'security_manager');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('observation.create', 'observation.view')
where r.code in ('medical_manager', 'stewarding_manager', 'team_leader');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'observation.create'
where r.code in ('field_reporter', 'temporary_reporter');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'observation.view'
where r.code in ('event_director', 'event_safety_manager', 'managing_director', 'operations_director', 'read_only_auditor');
