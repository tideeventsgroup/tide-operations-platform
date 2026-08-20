-- Same tight distribution as intelligence.* (0053): evidence chain-of-
-- custody is exactly the "restricted security/investigation" category in
-- docs/data-classification.md. No medical/stewarding/document/risk/client
-- or external role gets any of these. Per the standing rule: grant admin
-- in the SAME migration as the new permissions row.
insert into permissions (code, module, action, description) values
  ('evidence.log', 'evidence', 'log', 'Log evidence items against an incident'),
  ('evidence.view', 'evidence', 'view', 'View and access evidence items'),
  ('evidence.manage', 'evidence', 'manage', 'Change evidence status (review, release, dispose)');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('evidence.log', 'evidence.view', 'evidence.manage')
where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('evidence.log', 'evidence.view', 'evidence.manage')
where r.code in ('event_control_manager', 'event_controller', 'deputy_controller', 'security_manager');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'evidence.view'
where r.code in ('managing_director', 'operations_director', 'event_director', 'event_safety_manager');
