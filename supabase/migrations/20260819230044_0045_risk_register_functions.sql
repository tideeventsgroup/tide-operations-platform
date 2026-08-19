create function create_risk(
  p_event_id uuid,
  p_title text,
  p_likelihood smallint,
  p_impact smallint,
  p_description text default null,
  p_category text default null,
  p_mitigation text default null,
  p_owner_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_risk_id uuid;
  v_reference text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('risk.manage', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to manage risks on this event';
  end if;

  v_reference := next_event_reference(p_event_id, 'RSK');

  insert into risks (organisation_id, event_id, reference, title, description, category, likelihood, impact, mitigation, owner_id, created_by)
  values (v_event.organisation_id, p_event_id, v_reference, p_title, p_description, p_category, p_likelihood, p_impact, p_mitigation, p_owner_id, auth.uid())
  returning id into v_risk_id;

  perform record_audit_event('risk', v_risk_id, 'created', p_event_id := p_event_id,
    p_after_state := jsonb_build_object('reference', v_reference, 'title', p_title, 'likelihood', p_likelihood, 'impact', p_impact));

  return v_risk_id;
end;
$$;

create function update_risk_status(p_risk_id uuid, p_status risk_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_risk risks%rowtype;
begin
  select * into v_risk from risks where id = p_risk_id;
  if v_risk.id is null then raise exception 'Risk not found'; end if;
  if not has_permission('risk.manage', v_risk.organisation_id, null, v_risk.event_id) then
    raise exception 'Not authorised to manage risks on this event';
  end if;
  if v_risk.status = 'closed' then
    raise exception 'Risk is already closed';
  end if;

  update risks set
    status = p_status,
    closed_at = case when p_status = 'closed' then now() else closed_at end,
    closed_by = case when p_status = 'closed' then auth.uid() else closed_by end
  where id = p_risk_id;

  perform record_audit_event('risk', p_risk_id, 'status_changed', p_event_id := v_risk.event_id,
    p_before_state := jsonb_build_object('status', v_risk.status),
    p_after_state := jsonb_build_object('status', p_status),
    p_reason := p_note);
end;
$$;

create function update_risk_assessment(
  p_risk_id uuid,
  p_likelihood smallint,
  p_impact smallint,
  p_mitigation text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_risk risks%rowtype;
begin
  select * into v_risk from risks where id = p_risk_id;
  if v_risk.id is null then raise exception 'Risk not found'; end if;
  if not has_permission('risk.manage', v_risk.organisation_id, null, v_risk.event_id) then
    raise exception 'Not authorised to manage risks on this event';
  end if;

  update risks set likelihood = p_likelihood, impact = p_impact, mitigation = coalesce(p_mitigation, mitigation)
  where id = p_risk_id;

  perform record_audit_event('risk', p_risk_id, 'reassessed', p_event_id := v_risk.event_id,
    p_before_state := jsonb_build_object('likelihood', v_risk.likelihood, 'impact', v_risk.impact),
    p_after_state := jsonb_build_object('likelihood', p_likelihood, 'impact', p_impact));
end;
$$;

create function complete_readiness_check(p_event_id uuid, p_checklist_item_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('risk.manage', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to manage readiness for this event';
  end if;
  if not exists (select 1 from readiness_checklist_items where id = p_checklist_item_id and organisation_id = v_event.organisation_id) then
    raise exception 'Unknown readiness checklist item for this organisation';
  end if;

  insert into event_readiness_checks (event_id, checklist_item_id, completed, completed_by, completed_at, notes)
  values (p_event_id, p_checklist_item_id, true, auth.uid(), now(), p_notes)
  on conflict (event_id, checklist_item_id)
  do update set completed = true, completed_by = auth.uid(), completed_at = now(), notes = p_notes;
end;
$$;

create function uncomplete_readiness_check(p_event_id uuid, p_checklist_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('risk.manage', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to manage readiness for this event';
  end if;

  update event_readiness_checks set completed = false, completed_by = null, completed_at = null
  where event_id = p_event_id and checklist_item_id = p_checklist_item_id;
end;
$$;

revoke execute on function create_risk(uuid, text, smallint, smallint, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function update_risk_status(uuid, risk_status, text) from public, anon, authenticated;
revoke execute on function update_risk_assessment(uuid, smallint, smallint, text) from public, anon, authenticated;
revoke execute on function complete_readiness_check(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function uncomplete_readiness_check(uuid, uuid) from public, anon, authenticated;

grant execute on function create_risk(uuid, text, smallint, smallint, text, text, text, uuid) to authenticated;
grant execute on function update_risk_status(uuid, risk_status, text) to authenticated;
grant execute on function update_risk_assessment(uuid, smallint, smallint, text) to authenticated;
grant execute on function complete_readiness_check(uuid, uuid, text) to authenticated;
grant execute on function uncomplete_readiness_check(uuid, uuid) to authenticated;
