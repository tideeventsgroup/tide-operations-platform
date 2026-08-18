alter table incident_actions enable row level security;
alter table incident_decisions enable row level security;
alter table incident_resources enable row level security;

-- Select-only for all three: writes go exclusively through the guarded
-- SECURITY DEFINER functions in 0027 (create/complete/cancel_incident_action,
-- record_incident_decision, request_incident_resource,
-- update_incident_resource_status), which bypass RLS by design. No
-- INSERT/UPDATE/DELETE policy exists for authenticated — decisions in
-- particular are append-only for the same reason the timeline is.

create policy incident_actions_select on incident_actions
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));

create policy incident_decisions_select on incident_decisions
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));

create policy incident_resources_select on incident_resources
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));
