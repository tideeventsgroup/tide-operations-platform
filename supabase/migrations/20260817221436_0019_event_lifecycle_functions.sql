-- Guarded event lifecycle transitions (spec §32-34). Direct UPDATE of
-- lifecycle_stage is not blocked at the grant level (unlike documents'
-- transition_document_status pattern) because RLS + these RPCs are the
-- intended path and no UI ever calls UPDATE directly — but the RPCs are
-- what record history and enforce the confirmation requirements.

create function change_event_stage(
  p_event_id uuid,
  p_to_stage event_lifecycle_stage,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'Event not found';
  end if;
  if not has_permission('event.administer', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to change this event''s lifecycle stage';
  end if;
  if p_to_stage = 'live' then
    raise exception 'Use activate_event() to go live — it requires explicit confirmation';
  end if;

  update events set lifecycle_stage = p_to_stage,
    current_phase = case when p_to_stage <> 'live' then null else current_phase end
  where id = p_event_id;

  insert into event_stage_history (event_id, from_stage, to_stage, changed_by, reason)
  values (p_event_id, v_event.lifecycle_stage, p_to_stage, auth.uid(), p_reason);

  perform record_audit_event('event', p_event_id, 'lifecycle_stage_changed',
    p_before_state := jsonb_build_object('stage', v_event.lifecycle_stage),
    p_after_state := jsonb_build_object('stage', p_to_stage),
    p_reason := p_reason);
end;
$$;

-- Live activation (spec §33) — a deliberate, confirmed action, never
-- accidental. Requires event.activate specifically (not just administer).
create function activate_event(
  p_event_id uuid,
  p_comments text default null,
  p_acknowledged_warnings text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'Event not found';
  end if;
  if not has_permission('event.activate', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to activate this event';
  end if;
  if v_event.lifecycle_stage = 'live' then
    raise exception 'Event is already live';
  end if;

  update events set lifecycle_stage = 'live', current_phase = 'pre_open' where id = p_event_id;

  insert into event_stage_history (event_id, from_stage, to_stage, changed_by, reason)
  values (p_event_id, v_event.lifecycle_stage, 'live', auth.uid(), p_comments);

  perform record_audit_event('event', p_event_id, 'activated',
    p_before_state := jsonb_build_object('stage', v_event.lifecycle_stage),
    p_after_state := jsonb_build_object(
      'stage', 'live', 'comments', p_comments, 'acknowledged_warnings', p_acknowledged_warnings
    ),
    p_reason := p_comments);
end;
$$;

-- Live-operations phase (spec §34) — only meaningful while live.
create function change_event_phase(p_event_id uuid, p_phase event_phase)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'Event not found';
  end if;
  if v_event.lifecycle_stage <> 'live' then
    raise exception 'Event phase can only be changed while the event is live';
  end if;
  if not has_permission('event.administer', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to change this event''s phase';
  end if;

  update events set current_phase = p_phase where id = p_event_id;

  perform record_audit_event('event', p_event_id, 'phase_changed',
    p_before_state := jsonb_build_object('phase', v_event.current_phase),
    p_after_state := jsonb_build_object('phase', p_phase));
end;
$$;

revoke execute on function change_event_stage(uuid, event_lifecycle_stage, text) from public, anon;
revoke execute on function activate_event(uuid, text, text[]) from public, anon;
revoke execute on function change_event_phase(uuid, event_phase) from public, anon;

grant execute on function change_event_stage(uuid, event_lifecycle_stage, text) to authenticated;
grant execute on function activate_event(uuid, text, text[]) to authenticated;
grant execute on function change_event_phase(uuid, event_phase) to authenticated;
