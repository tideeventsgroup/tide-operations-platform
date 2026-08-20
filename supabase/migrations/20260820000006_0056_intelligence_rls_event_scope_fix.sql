-- 0054's people/vehicles SELECT policies required an organisation-wide
-- intelligence.view grant. But intelligence.manage/view grants for
-- operational roles (event_controller, deputy_controller, security_manager)
-- are typically event-scoped, same as other roles in this project. Under
-- the org-wide-only policy, an event-scoped grantee could create a person
-- via create_person() (which checks has_permission(..., event_id) and
-- succeeds) but then never see it back — PostgREST's embedded
-- `people(*)`/`vehicles(*)` resolution in listIncidentPeople/
-- listIncidentVehicles respects RLS on the embedded table independently of
-- the incident_people/incident_vehicles row being visible.
--
-- Fix: also allow access when the record is linked (via incident_people/
-- incident_vehicles) to an incident the caller holds intelligence.view for,
-- scoped to that incident's event. Org-wide grants (the broader case)
-- still work unchanged. A person/vehicle record with no link the caller
-- can see remains invisible, which is the correct default.

drop policy people_select on people;
create policy people_select on people
  for select using (
    has_permission('intelligence.view', organisation_id, null, null)
    or exists (
      select 1 from incident_people ip
      join incidents i on i.id = ip.incident_id
      where ip.person_id = people.id
      and has_permission('intelligence.view', i.organisation_id, null, i.event_id)
    )
  );

drop policy vehicles_select on vehicles;
create policy vehicles_select on vehicles
  for select using (
    has_permission('intelligence.view', organisation_id, null, null)
    or exists (
      select 1 from incident_vehicles iv
      join incidents i on i.id = iv.incident_id
      where iv.vehicle_id = vehicles.id
      and has_permission('intelligence.view', i.organisation_id, null, i.event_id)
    )
  );
