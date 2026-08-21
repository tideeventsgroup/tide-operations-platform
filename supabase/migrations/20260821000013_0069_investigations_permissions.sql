-- Same tight distribution as intelligence.*/evidence.* — investigations
-- are the most sensitive layer yet (they aggregate people/vehicles/
-- evidence/incidents into a single case file). Per the standing rule:
-- grant admin in the SAME migration as the new permissions row.
insert into permissions (code, module, action, description) values
  ('investigation.view', 'investigation', 'view', 'View investigations'),
  ('investigation.manage', 'investigation', 'manage', 'Open, manage, and link records into investigations');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('investigation.view', 'investigation.manage')
where r.code = 'admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code in ('investigation.view', 'investigation.manage')
where r.code in ('event_control_manager', 'security_manager');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.code = 'investigation.view'
where r.code in ('managing_director', 'operations_director');
