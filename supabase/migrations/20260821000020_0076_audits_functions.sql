create function create_audit_template(p_organisation_id uuid, p_name text, p_description text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id uuid;
begin
  if not has_permission('audit.manage', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;

  insert into audit_templates (organisation_id, name, description, created_by)
  values (p_organisation_id, p_name, p_description, auth.uid())
  returning id into v_template_id;

  return v_template_id;
end;
$$;

create function add_audit_template_question(
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
  if not has_permission('audit.manage', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to manage audit templates';
  end if;
  if p_weight < 1 then raise exception 'Weight must be at least 1'; end if;

  insert into audit_template_questions (template_id, section, question_text, sort_order, weight)
  values (p_template_id, p_section, p_question_text, p_sort_order, p_weight)
  returning id into v_question_id;

  return v_question_id;
end;
$$;

create function start_audit_submission(p_template_id uuid, p_event_id uuid default null, p_location_id uuid default null)
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
  if not has_permission('audit.submit', v_template.organisation_id, null, null) then
    raise exception 'Not authorised to submit audits';
  end if;

  insert into audit_submissions (organisation_id, template_id, event_id, location_id, submitted_by)
  values (v_template.organisation_id, p_template_id, p_event_id, p_location_id, auth.uid())
  returning id into v_submission_id;

  return v_submission_id;
end;
$$;

create function answer_audit_question(
  p_submission_id uuid,
  p_question_id uuid,
  p_response audit_response,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission audit_submissions%rowtype;
  v_answer_id uuid;
begin
  select * into v_submission from audit_submissions where id = p_submission_id;
  if v_submission.id is null then raise exception 'Audit submission not found'; end if;
  if v_submission.submitted_by != auth.uid() then
    raise exception 'Only the person who started this audit can answer its questions';
  end if;
  if v_submission.status != 'draft' then
    raise exception 'This audit has already been submitted';
  end if;
  if not exists (select 1 from audit_template_questions where id = p_question_id and template_id = v_submission.template_id) then
    raise exception 'Question does not belong to this audit''s template';
  end if;

  insert into audit_answers (submission_id, question_id, response, notes)
  values (p_submission_id, p_question_id, p_response, p_notes)
  on conflict (submission_id, question_id) do update set response = excluded.response, notes = excluded.notes, answered_at = now()
  returning id into v_answer_id;

  return v_answer_id;
end;
$$;

-- Score = weighted pass rate over every answered, non-N/A question.
-- Unanswered questions and 'not_applicable' responses are excluded from
-- the denominator rather than counted as failures.
create function submit_audit(p_submission_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission audit_submissions%rowtype;
  v_score numeric;
begin
  select * into v_submission from audit_submissions where id = p_submission_id;
  if v_submission.id is null then raise exception 'Audit submission not found'; end if;
  if v_submission.submitted_by != auth.uid() then
    raise exception 'Only the person who started this audit can submit it';
  end if;
  if v_submission.status != 'draft' then
    raise exception 'This audit has already been submitted';
  end if;

  select case when sum(q.weight) filter (where a.response != 'not_applicable') > 0
    then round(100.0 * sum(q.weight) filter (where a.response = 'pass') / sum(q.weight) filter (where a.response != 'not_applicable'), 1)
    else null
  end
  into v_score
  from audit_answers a
  join audit_template_questions q on q.id = a.question_id
  where a.submission_id = p_submission_id;

  update audit_submissions set status = 'submitted', submitted_at = now(), score = v_score where id = p_submission_id;

  return v_score;
end;
$$;

revoke execute on function create_audit_template(uuid, text, text) from public, anon, authenticated;
revoke execute on function add_audit_template_question(uuid, text, text, int, int) from public, anon, authenticated;
revoke execute on function start_audit_submission(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function answer_audit_question(uuid, uuid, audit_response, text) from public, anon, authenticated;
revoke execute on function submit_audit(uuid) from public, anon, authenticated;

grant execute on function create_audit_template(uuid, text, text) to authenticated;
grant execute on function add_audit_template_question(uuid, text, text, int, int) to authenticated;
grant execute on function start_audit_submission(uuid, uuid, uuid) to authenticated;
grant execute on function answer_audit_question(uuid, uuid, audit_response, text) to authenticated;
grant execute on function submit_audit(uuid) to authenticated;
