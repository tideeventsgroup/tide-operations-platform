-- record_audit_event was internal-only (0010) because p_organisation_id
-- was a trusted parameter: an authenticated caller could pass a
-- *different* organisation's id and forge entries into its audit trail.
-- Fix: for real user sessions (auth.uid() is not null), always use the
-- caller's own organisation regardless of what was passed — the parameter
-- only matters for service-role/background-job contexts where there is no
-- session to derive it from. Now safe to expose to authenticated, which
-- server actions need in order to log admin actions (approve, revoke, ...).

create or replace function record_audit_event(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_organisation_id uuid default null,
  p_event_id uuid default null,
  p_before_state jsonb default null,
  p_after_state jsonb default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_org_id uuid;
begin
  v_org_id := case when auth.uid() is not null then current_organisation_id() else p_organisation_id end;

  insert into audit_logs (
    actor_id, organisation_id, event_id, entity_type, entity_id,
    action, before_state, after_state, reason
  ) values (
    auth.uid(), v_org_id, p_event_id, p_entity_type, p_entity_id,
    p_action, p_before_state, p_after_state, p_reason
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function record_audit_event(text, uuid, text, uuid, uuid, jsonb, jsonb, text) to authenticated;
