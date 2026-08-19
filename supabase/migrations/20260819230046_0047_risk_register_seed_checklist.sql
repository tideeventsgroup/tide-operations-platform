insert into readiness_checklist_items (organisation_id, code, name, description, sort_order)
select o.id, defaults.code, defaults.name, defaults.description, defaults.sort_order
from organisations o, (values
  ('safety_plan_issued', 'Event Safety Plan issued', 'The core safety management document has been approved and issued.', 1),
  ('risk_assessment_reviewed', 'Risk assessment reviewed', 'The risk register has been reviewed with no unmitigated high-severity risks outstanding.', 2),
  ('medical_confirmed', 'Medical cover confirmed', 'Medical provision is booked and confirmed for the event.', 3),
  ('security_confirmed', 'Security staffing confirmed', 'Security staffing numbers and briefing are confirmed.', 4),
  ('traffic_management_confirmed', 'Traffic management confirmed', 'Traffic management plan is in place and resourced.', 5),
  ('welfare_confirmed', 'Welfare provision confirmed', 'Welfare arrangements for public, staff, and vulnerable persons are confirmed.', 6),
  ('comms_confirmed', 'Communications plan confirmed', 'Event Control comms structure and channel allocation are confirmed.', 7),
  ('evacuation_confirmed', 'Evacuation plan confirmed', 'Site evacuation and shelter-in-place procedures are confirmed.', 8)
) as defaults(code, name, description, sort_order)
where o.code = 'TEG';
