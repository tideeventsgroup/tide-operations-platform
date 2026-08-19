alter table risks enable row level security;
alter table readiness_checklist_items enable row level security;
alter table event_readiness_checks enable row level security;

create policy risks_select on risks
  for select using (organisation_id = current_organisation_id() and has_permission('risk.view', organisation_id, null, event_id));
-- No direct INSERT/UPDATE/DELETE: writes go through create_risk/update_risk_status/update_risk_assessment.

create policy readiness_checklist_items_select on readiness_checklist_items
  for select using (is_staff() and organisation_id = current_organisation_id());
create policy readiness_checklist_items_admin_write on readiness_checklist_items
  for all using (is_admin() and organisation_id = current_organisation_id())
  with check (is_admin() and organisation_id = current_organisation_id());

create policy event_readiness_checks_select on event_readiness_checks
  for select using (exists (
    select 1 from events e where e.id = event_id and has_permission('risk.view', e.organisation_id, e.client_id, e.id)
  ));
-- No direct INSERT/UPDATE/DELETE: writes go through complete_readiness_check/uncomplete_readiness_check.
