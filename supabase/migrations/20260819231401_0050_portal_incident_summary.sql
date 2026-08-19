-- Client-facing incident visibility must be a redacted view, never raw
-- row access — see docs/incident-control.md §Reporting. External portal
-- roles have no incident.view permission at all; this function returns
-- aggregate counts only, gated on event.view (already granted to
-- client_administrator/client_reviewer/client_viewer/contractor/supplier
-- in 0006) plus the event's own portal_enabled flag.
create function get_portal_incident_summary(p_event_id uuid)
returns table(total_incidents bigint, open_incidents bigint, resolved_incidents bigint, closed_incidents bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not v_event.portal_enabled then raise exception 'Portal is not enabled for this event'; end if;
  if not has_permission('event.view', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to view this event';
  end if;

  return query
  select
    count(*)::bigint as total_incidents,
    count(*) filter (where status not in ('resolved', 'closed'))::bigint as open_incidents,
    count(*) filter (where status = 'resolved')::bigint as resolved_incidents,
    count(*) filter (where status = 'closed')::bigint as closed_incidents
  from incidents where event_id = p_event_id;
end;
$$;

revoke execute on function get_portal_incident_summary(uuid) from public, anon, authenticated;
grant execute on function get_portal_incident_summary(uuid) to authenticated;
