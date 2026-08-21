-- Both functions are gated on incident.view_restricted, not a separate
-- "manage" permission — the existing seed only ever defined the one code
-- (0006), and the set of roles holding it (directors, safety, control,
-- security, medical) is already exactly "who should be trusted to both
-- see and set this", so a second permission code would add ceremony
-- without changing who's actually authorised for anything in practice.

create function set_incident_classification(p_incident_id uuid, p_classification classification_level)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.view_restricted', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to change this incident''s classification';
  end if;
  if p_classification = v_incident.classification then
    raise exception 'Incident already has that classification';
  end if;

  update incidents set classification = p_classification where id = p_incident_id;

  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'update', format('Classification changed: %s → %s', v_incident.classification, p_classification), auth.uid());

  perform record_audit_event('incident', p_incident_id, 'classification_changed', v_incident.organisation_id, v_incident.event_id,
    jsonb_build_object('classification', v_incident.classification), jsonb_build_object('classification', p_classification), null);
end;
$$;

-- Upsert. The timeline entry deliberately never includes the body text —
-- it's restricted precisely so it doesn't end up somewhere a broader
-- incident.view audience can read it.
create function set_incident_restricted_narrative(p_incident_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_existed boolean;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('incident.view_restricted', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to record restricted detail for this incident';
  end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Restricted detail cannot be empty'; end if;

  select exists (select 1 from incident_restricted_narrative where incident_id = p_incident_id) into v_existed;

  insert into incident_restricted_narrative (incident_id, body, created_by)
  values (p_incident_id, p_body, auth.uid())
  on conflict (incident_id) do update set body = excluded.body, updated_by = auth.uid(), updated_at = now();

  insert into incident_log_entries (incident_id, entry_type, body, author_id)
  values (p_incident_id, 'update',
    case when v_existed then 'Restricted detail updated' else 'Restricted detail recorded' end, auth.uid());

  perform record_audit_event('incident', p_incident_id, 'restricted_narrative_set', v_incident.organisation_id, v_incident.event_id, null, null, null);
end;
$$;

revoke execute on function set_incident_classification(uuid, classification_level) from public, anon, authenticated;
revoke execute on function set_incident_restricted_narrative(uuid, text) from public, anon, authenticated;

grant execute on function set_incident_classification(uuid, classification_level) to authenticated;
grant execute on function set_incident_restricted_narrative(uuid, text) to authenticated;
