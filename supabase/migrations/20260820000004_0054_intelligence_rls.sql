-- No insert/update/delete grant to authenticated on any of these tables —
-- every mutation goes through the guarded RPCs in 0052 (security definer,
-- bypasses RLS, does its own has_permission check). RLS here governs reads
-- only, same append-only-style model as incident_log_entries/audit_logs.

alter table people enable row level security;
alter table vehicles enable row level security;
alter table incident_people enable row level security;
alter table incident_vehicles enable row level security;

-- people/vehicles aren't tied to a single event (the same record can recur
-- across events), so their own read policy requires an organisation-wide
-- intelligence.view grant rather than resolving through one incident.
create policy people_select on people
  for select using (has_permission('intelligence.view', organisation_id, null, null));

create policy vehicles_select on vehicles
  for select using (has_permission('intelligence.view', organisation_id, null, null));

-- The join tables resolve through their incident's event, same pattern as
-- incident_agencies_select (0037) — so an event-scoped grant also works.
create policy incident_people_select on incident_people
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('intelligence.view', i.organisation_id, null, i.event_id)
  ));

create policy incident_vehicles_select on incident_vehicles
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('intelligence.view', i.organisation_id, null, i.event_id)
  ));
