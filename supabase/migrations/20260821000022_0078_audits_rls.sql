alter table audit_templates enable row level security;
alter table audit_template_questions enable row level security;
alter table audit_submissions enable row level security;
alter table audit_answers enable row level security;

-- Templates/questions are visible to anyone who can submit or view audits
-- — you need to see the template to run it.
create policy audit_templates_select on audit_templates
  for select using (
    has_permission('audit.submit', organisation_id, null, null)
    or has_permission('audit.view', organisation_id, null, null)
  );

create policy audit_template_questions_select on audit_template_questions
  for select using (exists (
    select 1 from audit_templates t where t.id = template_id
    and (has_permission('audit.submit', t.organisation_id, null, null) or has_permission('audit.view', t.organisation_id, null, null))
  ));

-- Submissions: audit.view holders see everything in the org; everyone else
-- sees only their own (so a submitter can always find their own drafts
-- and history even without the broader view permission).
create policy audit_submissions_select on audit_submissions
  for select using (
    has_permission('audit.view', organisation_id, null, null)
    or submitted_by = auth.uid()
  );

create policy audit_answers_select on audit_answers
  for select using (exists (
    select 1 from audit_submissions s where s.id = submission_id
    and (has_permission('audit.view', s.organisation_id, null, null) or s.submitted_by = auth.uid())
  ));
