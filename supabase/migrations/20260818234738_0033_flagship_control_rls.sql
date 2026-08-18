alter table event_control_roles enable row level security;
alter table event_control_sessions enable row level security;
alter table methane_messages enable row level security;
alter table methane_message_versions enable row level security;
alter table major_incident_activations enable row level security;

create policy event_control_roles_select on event_control_roles
  for select using (is_staff() and organisation_id = current_organisation_id());
create policy event_control_roles_admin_write on event_control_roles
  for all using (is_admin() and organisation_id = current_organisation_id())
  with check (is_admin() and organisation_id = current_organisation_id());

-- event_control_sessions: writes only via start_control_session/
-- end_control_session (0031), which run SECURITY DEFINER and bypass RLS.
create policy event_control_sessions_select on event_control_sessions
  for select using (exists (
    select 1 from events e where e.id = event_id and has_permission('event.view', e.organisation_id, e.client_id, e.id)
  ));

-- methane_messages / methane_message_versions: select only. Writes go
-- exclusively through create_methane_message() — no INSERT/UPDATE/DELETE
-- policy for authenticated, versions are append-only for the same reason
-- the incident timeline is.
create policy methane_messages_select on methane_messages
  for select using (exists (
    select 1 from incidents i where i.id = incident_id and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));

create policy methane_message_versions_select on methane_message_versions
  for select using (exists (
    select 1 from methane_messages m
    join incidents i on i.id = m.incident_id
    where m.id = methane_message_id and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));

-- major_incident_activations: select only. Writes go exclusively through
-- activate_major_incident()/deactivate_major_incident().
create policy major_incident_activations_select on major_incident_activations
  for select using (exists (
    select 1 from incidents i where i.id = incident_id and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));
