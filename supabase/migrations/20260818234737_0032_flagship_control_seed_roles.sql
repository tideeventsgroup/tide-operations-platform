insert into event_control_roles (organisation_id, code, name, sort_order)
select o.id, defaults.code, defaults.name, defaults.sort_order
from organisations o, (values
  ('lead_controller', 'Lead Controller', 1),
  ('deputy_controller', 'Deputy Controller', 2),
  ('loggist', 'Loggist', 3),
  ('safety_advisor', 'Safety Advisor', 4),
  ('liaison', 'Agency Liaison', 5)
) as defaults(code, name, sort_order)
where o.code = 'TEG';
