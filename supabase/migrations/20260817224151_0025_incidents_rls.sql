alter table incident_categories enable row level security;
alter table incident_priorities enable row level security;
alter table incidents enable row level security;
alter table incident_log_entries enable row level security;
alter table event_id_counters enable row level security; -- no policies: locked to SECURITY DEFINER only

create policy incident_categories_select on incident_categories for select using (is_staff());

create policy incident_priorities_select on incident_priorities
  for select using (is_staff() and organisation_id = current_organisation_id());
create policy incident_priorities_admin_write on incident_priorities
  for all using (is_admin() and organisation_id = current_organisation_id())
  with check (is_admin() and organisation_id = current_organisation_id());

-- incidents: view is classification-aware in spirit (restricted detail
-- lives elsewhere — see docs/data-classification.md), scoped by event.
create policy incidents_select on incidents
  for select using (organisation_id = current_organisation_id() and has_permission('incident.view', organisation_id, null, event_id));
create policy incidents_update on incidents
  for update using (organisation_id = current_organisation_id() and has_permission('incident.update', organisation_id, null, event_id))
  with check (organisation_id = current_organisation_id() and has_permission('incident.update', organisation_id, null, event_id));
-- No direct INSERT/DELETE policy: incidents are created only via
-- create_incident() (needs the atomic reference + first log entry) and
-- are never deleted (closure/reopening is the lifecycle, not removal).

-- incident_log_entries: select only. All writes go through
-- append_incident_log_entry() / add_incident_correction(), which run
-- SECURITY DEFINER and bypass RLS — no INSERT/UPDATE/DELETE policy exists
-- for authenticated, which is what makes the timeline actually append-only
-- rather than just conventionally so.
create policy incident_log_entries_select on incident_log_entries
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('incident.view', i.organisation_id, null, i.event_id)
  ));
