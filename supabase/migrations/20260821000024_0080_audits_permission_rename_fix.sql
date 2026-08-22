-- 0077 failed to apply: 'audit.view' already existed as a permission code
-- from Phase 1 (0006) — "View the audit log", a completely different
-- concept (the system activity trail) from this module's compliance
-- audits. Same treatment as 0042 fixing 0040's bug: a new forward
-- migration, not a silent rewrite of what already ran. Renames the
-- module from 'audit' to 'site_audit' throughout — 0076's functions and
-- 0078's RLS policies were written with the colliding 'audit.manage'/
-- 'audit.submit' text baked in (0077's insert never landed, since it was
-- one failed transaction), so those need correcting here too.

create or replace function create_audit_template(p_organisation_id uuid, p_name text, p_description text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id uuid;
begin
  if not has_permission('site_audit.manage', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;

  insert into audit_templates (organisation_id, name, description, created_by)
  values (p_organisation_id, p_name, p_description, auth.uid())
  returning id into v_template_id;

  return v_template_id;
end;
$$;

create or replace function add_audit_template_question(
  p_template_id uuid,
  p_question_text text,
  p_section text default null,
  p_sort_order int default 0,
  p_weight int default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template audit_templates%rowtype;
  v_question_id uuid;
begin
  select * into v_template from audit_templates where id = p_template_id;
  if v_template.id is null then raise exception 'Audit template not found'; end if;
  if not has_permission('site_audit.manage', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;
  if p_weight < 1 then raise exception 'Weight must be at least 1'; end if;

  insert into audit_template_questions (template_id, section, question_text, sort_order, weight)
  values (p_template_id, p_section, p_question_text, p_sort_order, p_weight)
  returning id into v_question_id;

  return v_question_id;
end;
$$;

create or replace function start_audit_submission(p_template_id uuid, p_event_id uuid default null, p_location_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template audit_templates%rowtype;
  v_submission_id uuid;
begin
  select * into v_template from audit_templates where id = p_template_id and is_active;
  if v_template.id is null then raise exception 'Audit template not found or inactive'; end if;
  if not has_permission('site_audit.submit', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to submit audits';
  end if;

  insert into audit_submissions (organisation_id, template_id, event_id, location_id, submitted_by)
  values (v_template.organisation_id, p_template_id, p_event_id, p_location_id, auth.uid())
  returning id into v_submission_id;

  return v_submission_id;
end;
$$;

comment on function answer_audit_question(uuid, uuid, audit_response, text) is 'Unchanged by 0080 — ownership check (submitted_by = auth.uid()) rather than a permission lookup, so no colliding code to fix here.';
comment on function submit_audit(uuid) is 'Unchanged by 0080 — same reason as answer_audit_question.';
