drop policy audit_templates_select on audit_templates;
create policy audit_templates_select on audit_templates
  for select using (
    has_permission('site_audit.submit', organisation_id, null, null)
    or has_permission('site_audit.view', organisation_id, null, null)
  );

drop policy audit_template_questions_select on audit_template_questions;
create policy audit_template_questions_select on audit_template_questions
  for select using (exists (
    select 1 from audit_templates t where t.id = template_id
    and (has_permission('site_audit.submit', t.organisation_id, null, null) or has_permission('site_audit.view', t.organisation_id, null, null))
  ));

drop policy audit_submissions_select on audit_submissions;
create policy audit_submissions_select on audit_submissions
  for select using (
    has_permission('site_audit.view', organisation_id, null, null)
    or submitted_by = auth.uid()
  );

drop policy audit_answers_select on audit_answers;
create policy audit_answers_select on audit_answers
  for select using (exists (
    select 1 from audit_submissions s where s.id = submission_id
    and (has_permission('site_audit.view', s.organisation_id, null, null) or s.submitted_by = auth.uid())
  ));
