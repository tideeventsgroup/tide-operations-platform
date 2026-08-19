-- Phase 9: Planning & Risk. Two new permission codes — risk_manager
-- currently only has event.view (0006), nothing risk-specific was ever
-- seeded. Per the standing rule in docs/architecture.md: grant admin in
-- the SAME migration as the new permissions row, not as an afterthought.
insert into permissions (code, module, action, description) values
  ('risk.view', 'risk', 'view', 'View the risk register and readiness checklist'),
  ('risk.manage', 'risk', 'manage', 'Create/update risks and complete readiness checklist items');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('risk.view', 'risk.manage')
where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('risk.view', 'risk.manage')
where r.code in ('risk_manager', 'event_safety_manager', 'event_control_manager');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'risk.view'
where r.code in ('managing_director', 'operations_director', 'event_director', 'read_only_auditor');
