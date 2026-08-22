-- A starting template so Audits is usable immediately rather than
-- requiring admin setup before anyone can run one — same rationale as
-- seeding incident_categories/document_types in earlier phases.
do $$
declare
  v_org_id uuid;
  v_template_id uuid;
begin
  select id into v_org_id from organisations where code = 'TEG';
  if v_org_id is null then return; end if;

  insert into audit_templates (organisation_id, name, description)
  values (v_org_id, 'Site Safety & Security Compliance', 'General-purpose walk-through audit covering perimeter, stewarding, and welfare provision.')
  returning id into v_template_id;

  insert into audit_template_questions (template_id, section, question_text, sort_order, weight) values
    (v_template_id, 'Perimeter', 'Perimeter fencing is intact with no unauthorised gaps', 1, 2),
    (v_template_id, 'Perimeter', 'All access points are staffed and searching in line with policy', 2, 2),
    (v_template_id, 'Perimeter', 'CCTV coverage is unobstructed at key entry/exit points', 3, 1),
    (v_template_id, 'Stewarding', 'Stewards are briefed and wearing identifiable hi-vis', 4, 1),
    (v_template_id, 'Stewarding', 'Radio communications are clear and being monitored', 5, 1),
    (v_template_id, 'Stewarding', 'Crowd density at key locations is within capacity limits', 6, 2),
    (v_template_id, 'Welfare', 'Welfare/medical point is staffed and clearly signposted', 7, 2),
    (v_template_id, 'Welfare', 'First aid equipment is stocked and accessible', 8, 1),
    (v_template_id, 'Documentation', 'Incident log/radio log is being maintained up to date', 9, 1),
    (v_template_id, 'Documentation', 'Emergency evacuation routes are clear and signed', 10, 2);
end $$;
