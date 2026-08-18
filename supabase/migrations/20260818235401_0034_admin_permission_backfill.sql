-- The admin role's grant in 0006 was `cross join permissions` at seed
-- time — it does not retroactively pick up permissions added by later
-- migrations (e.g. 0031's event.control_session.manage and
-- incident.major_incident_mode). Backfill now, and see the standing rule
-- added to docs/architecture.md: every migration that inserts a new
-- permissions row must also grant it to admin in the same migration.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.code = 'admin'
and not exists (
  select 1 from role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
