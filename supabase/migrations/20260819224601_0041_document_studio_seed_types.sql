insert into document_types (organisation_id, code, name, description, sort_order)
select o.id, defaults.code, defaults.name, defaults.description, defaults.sort_order
from organisations o, (values
  ('safety_plan', 'Event Safety Plan', 'The core safety management document for the event.', 1),
  ('risk_assessment', 'Risk Assessment', 'Formal risk assessment and control measures.', 2),
  ('traffic_management_plan', 'Traffic Management Plan', 'Vehicle access, egress, and site traffic control.', 3),
  ('medical_plan', 'Medical Plan', 'Medical cover provision and emergency response arrangements.', 4),
  ('security_plan', 'Security Plan', 'Security staffing, search policy, and incident response.', 5),
  ('communications_plan', 'Communications Plan', 'Event Control comms structure and channel allocation.', 6),
  ('evacuation_plan', 'Evacuation Plan', 'Site evacuation and shelter-in-place procedures.', 7),
  ('welfare_plan', 'Welfare Plan', 'Welfare provision for public, staff, and vulnerable persons.', 8)
) as defaults(code, name, description, sort_order)
where o.code = 'TEG';
