alter table incident_restricted_narrative enable row level security;

create policy incident_restricted_narrative_select on incident_restricted_narrative
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('incident.view_restricted', i.organisation_id, null, i.event_id)
  ));
