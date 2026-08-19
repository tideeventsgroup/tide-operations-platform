alter table incident_agencies enable row level security;

create policy incident_agencies_select on incident_agencies
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));
