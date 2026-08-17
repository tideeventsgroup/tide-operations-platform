-- RLS for Phase 2. has_permission() already understands client_id/event_id
-- scoping from Phase 1 — these policies just wire tables to it.

alter table clients enable row level security;
alter table client_contacts enable row level security;
alter table client_contact_roles enable row level security;
alter table contact_role_types enable row level security;
alter table events enable row level security;
alter table event_stage_history enable row level security;
alter table event_characteristics enable row level security;
alter table characteristic_types enable row level security;
alter table operational_locations enable row level security;

-- Reference lookup tables: readable by any staff, no client-side writes.
create policy contact_role_types_select on contact_role_types for select using (is_staff());
create policy characteristic_types_select on characteristic_types for select using (is_staff());

create policy clients_select on clients
  for select using (organisation_id = current_organisation_id() and has_permission('client.view', organisation_id, id));
create policy clients_insert on clients
  for insert with check (organisation_id = current_organisation_id() and has_permission('client.create', organisation_id));
create policy clients_update on clients
  for update using (organisation_id = current_organisation_id() and has_permission('client.update', organisation_id, id))
  with check (organisation_id = current_organisation_id() and has_permission('client.update', organisation_id, id));
create policy clients_delete on clients
  for delete using (organisation_id = current_organisation_id() and has_permission('client.administer', organisation_id, id));

create policy client_contacts_select on client_contacts
  for select using (exists (select 1 from clients c where c.id = client_id and has_permission('client.view', c.organisation_id, c.id)));
create policy client_contacts_write on client_contacts
  for all using (exists (select 1 from clients c where c.id = client_id and has_permission('client.update', c.organisation_id, c.id)))
  with check (exists (select 1 from clients c where c.id = client_id and has_permission('client.update', c.organisation_id, c.id)));

create policy client_contact_roles_select on client_contact_roles
  for select using (exists (
    select 1 from client_contacts cc join clients c on c.id = cc.client_id
    where cc.id = contact_id and has_permission('client.view', c.organisation_id, c.id)
  ));
create policy client_contact_roles_write on client_contact_roles
  for all using (exists (
    select 1 from client_contacts cc join clients c on c.id = cc.client_id
    where cc.id = contact_id and has_permission('client.update', c.organisation_id, c.id)
  ))
  with check (exists (
    select 1 from client_contacts cc join clients c on c.id = cc.client_id
    where cc.id = contact_id and has_permission('client.update', c.organisation_id, c.id)
  ));

create policy events_select on events
  for select using (organisation_id = current_organisation_id() and has_permission('event.view', organisation_id, client_id, id));
create policy events_insert on events
  for insert with check (organisation_id = current_organisation_id() and has_permission('event.create', organisation_id, client_id));
create policy events_update on events
  for update using (organisation_id = current_organisation_id() and has_permission('event.update', organisation_id, client_id, id))
  with check (organisation_id = current_organisation_id() and has_permission('event.update', organisation_id, client_id, id));
create policy events_delete on events
  for delete using (organisation_id = current_organisation_id() and has_permission('event.administer', organisation_id, client_id, id));

create policy event_stage_history_select on event_stage_history
  for select using (exists (select 1 from events e where e.id = event_id and has_permission('event.view', e.organisation_id, e.client_id, e.id)));

create policy event_characteristics_select on event_characteristics
  for select using (exists (select 1 from events e where e.id = event_id and has_permission('event.view', e.organisation_id, e.client_id, e.id)));
create policy event_characteristics_write on event_characteristics
  for all using (exists (select 1 from events e where e.id = event_id and has_permission('event.update', e.organisation_id, e.client_id, e.id)))
  with check (exists (select 1 from events e where e.id = event_id and has_permission('event.update', e.organisation_id, e.client_id, e.id)));

create policy operational_locations_select on operational_locations
  for select using (exists (select 1 from events e where e.id = event_id and has_permission('event.view', e.organisation_id, e.client_id, e.id)));
create policy operational_locations_write on operational_locations
  for all using (exists (select 1 from events e where e.id = event_id and has_permission('event.update', e.organisation_id, e.client_id, e.id)))
  with check (exists (select 1 from events e where e.id = event_id and has_permission('event.update', e.organisation_id, e.client_id, e.id)));
