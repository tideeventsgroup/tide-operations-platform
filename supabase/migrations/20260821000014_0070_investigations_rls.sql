-- Investigations are organisation-scoped by design (a case can span
-- events), so unlike people/vehicles/evidence there's no event-scoped
-- fallback here — investigation.view/manage are meant to be held as
-- org-wide grants only.

alter table investigations enable row level security;
alter table investigation_incidents enable row level security;
alter table investigation_people enable row level security;
alter table investigation_vehicles enable row level security;
alter table investigation_evidence enable row level security;
alter table investigation_notes enable row level security;

create policy investigations_select on investigations
  for select using (has_permission('investigation.view', organisation_id, null, null));

create policy investigation_incidents_select on investigation_incidents
  for select using (exists (
    select 1 from investigations inv where inv.id = investigation_id
    and has_permission('investigation.view', inv.organisation_id, null, null)
  ));

create policy investigation_people_select on investigation_people
  for select using (exists (
    select 1 from investigations inv where inv.id = investigation_id
    and has_permission('investigation.view', inv.organisation_id, null, null)
  ));

create policy investigation_vehicles_select on investigation_vehicles
  for select using (exists (
    select 1 from investigations inv where inv.id = investigation_id
    and has_permission('investigation.view', inv.organisation_id, null, null)
  ));

create policy investigation_evidence_select on investigation_evidence
  for select using (exists (
    select 1 from investigations inv where inv.id = investigation_id
    and has_permission('investigation.view', inv.organisation_id, null, null)
  ));

create policy investigation_notes_select on investigation_notes
  for select using (exists (
    select 1 from investigations inv where inv.id = investigation_id
    and has_permission('investigation.view', inv.organisation_id, null, null)
  ));
