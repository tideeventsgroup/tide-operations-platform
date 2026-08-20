-- Deliberately tight distribution: person/vehicle intelligence records are
-- restricted/confidential by default (docs/data-classification.md), so
-- this does NOT follow the broader incident.view/update distribution.
-- Medical, stewarding, document, risk, client, and every external/client
-- role are excluded — only roles with an operational security/control
-- remit get it. Per the standing rule: grant admin in the SAME migration
-- as the new permissions row.
insert into permissions (code, module, action, description) values
  ('intelligence.view', 'intelligence', 'view', 'View person/vehicle intelligence records linked to incidents'),
  ('intelligence.manage', 'intelligence', 'manage', 'Create person/vehicle records and link them to incidents');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('intelligence.view', 'intelligence.manage')
where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('intelligence.view', 'intelligence.manage')
where r.code in ('event_control_manager', 'event_controller', 'deputy_controller', 'security_manager');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'intelligence.view'
where r.code in ('managing_director', 'operations_director', 'event_director', 'event_safety_manager');
