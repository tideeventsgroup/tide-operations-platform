-- Completes the audit-template RPC set (create_audit_template and
-- add_audit_template_question already exist but are called from nowhere
-- in the app yet).

create function update_audit_template(p_template_id uuid, p_name text, p_description text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template audit_templates%rowtype;
begin
  select * into v_template from audit_templates where id = p_template_id;
  if v_template.id is null then raise exception 'Audit template not found.'; end if;
  if not has_permission('site_audit.manage', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;

  update audit_templates set name = p_name, description = p_description where id = p_template_id;
end;
$$;

create function set_audit_template_active(p_template_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template audit_templates%rowtype;
begin
  select * into v_template from audit_templates where id = p_template_id;
  if v_template.id is null then raise exception 'Audit template not found.'; end if;
  if not has_permission('site_audit.manage', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;

  update audit_templates set is_active = p_is_active where id = p_template_id;
end;
$$;

create function delete_audit_template(p_template_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template audit_templates%rowtype;
  v_count int;
begin
  select * into v_template from audit_templates where id = p_template_id;
  if v_template.id is null then raise exception 'Audit template not found.'; end if;
  if not has_permission('site_audit.manage', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;

  select count(*) into v_count from audit_submissions where template_id = p_template_id;
  if v_count > 0 then
    raise exception '% audit(s) have been submitted against this template. Deactivate it instead of deleting.', v_count;
  end if;

  delete from audit_templates where id = p_template_id;
end;
$$;

create function update_audit_template_question(
  p_question_id uuid,
  p_question_text text,
  p_section text,
  p_sort_order int,
  p_weight int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question audit_template_questions%rowtype;
  v_template audit_templates%rowtype;
begin
  select * into v_question from audit_template_questions where id = p_question_id;
  if v_question.id is null then raise exception 'Question not found.'; end if;
  select * into v_template from audit_templates where id = v_question.template_id;
  if not has_permission('site_audit.manage', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;
  if p_weight < 1 then raise exception 'Weight must be at least 1'; end if;

  update audit_template_questions
  set question_text = p_question_text, section = p_section, sort_order = p_sort_order, weight = p_weight
  where id = p_question_id;
end;
$$;

create function delete_audit_template_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question audit_template_questions%rowtype;
  v_template audit_templates%rowtype;
  v_count int;
begin
  select * into v_question from audit_template_questions where id = p_question_id;
  if v_question.id is null then raise exception 'Question not found.'; end if;
  select * into v_template from audit_templates where id = v_question.template_id;
  if not has_permission('site_audit.manage', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;

  select count(*) into v_count from audit_answers where question_id = p_question_id;
  if v_count > 0 then
    raise exception 'This question has already been answered in % submitted audit(s) and cannot be removed. Deactivate the template instead.', v_count;
  end if;

  delete from audit_template_questions where id = p_question_id;
end;
$$;

create function update_organisation(p_organisation_id uuid, p_name text, p_legal_name text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('organisation.administer', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage organisation settings';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'Unknown organisation status "%".', p_status;
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Organisation name cannot be empty.';
  end if;

  update organisations set name = p_name, legal_name = p_legal_name, status = p_status where id = p_organisation_id;
end;
$$;

revoke execute on function update_audit_template(uuid, text, text) from public, anon, authenticated;
revoke execute on function set_audit_template_active(uuid, boolean) from public, anon, authenticated;
revoke execute on function delete_audit_template(uuid) from public, anon, authenticated;
revoke execute on function update_audit_template_question(uuid, text, text, int, int) from public, anon, authenticated;
revoke execute on function delete_audit_template_question(uuid) from public, anon, authenticated;
revoke execute on function update_organisation(uuid, text, text, text) from public, anon, authenticated;

grant execute on function update_audit_template(uuid, text, text) to authenticated;
grant execute on function set_audit_template_active(uuid, boolean) to authenticated;
grant execute on function delete_audit_template(uuid) to authenticated;
grant execute on function update_audit_template_question(uuid, text, text, int, int) to authenticated;
grant execute on function delete_audit_template_question(uuid) to authenticated;
grant execute on function update_organisation(uuid, text, text, text) to authenticated;
