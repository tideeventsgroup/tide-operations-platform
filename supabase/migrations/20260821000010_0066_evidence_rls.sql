alter table evidence_items enable row level security;
alter table evidence_custody_log enable row level security;

create policy evidence_items_select on evidence_items
  for select using (exists (
    select 1 from incidents i where i.id = incident_id
    and has_permission('evidence.view', i.organisation_id, null, i.event_id)
  ));

create policy evidence_custody_log_select on evidence_custody_log
  for select using (exists (
    select 1 from evidence_items ei
    join incidents i on i.id = ei.incident_id
    where ei.id = evidence_item_id
    and has_permission('evidence.view', i.organisation_id, null, i.event_id)
  ));

-- Path convention: {event_id}/{incident_id}/{evidence_item_id}/{filename}.
-- Every reference to the object path is qualified as storage.objects.name
-- explicitly — 0042 hit a column-shadowing bug from a bare `name` inside a
-- correlated subquery over a table (events) that also has a `name` column.
create policy evidence_files_select on storage.objects
  for select using (
    bucket_id = 'evidence-files'
    and exists (
      select 1 from events e
      where e.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and has_permission('evidence.view', e.organisation_id, e.client_id, e.id)
    )
  );

create policy evidence_files_insert on storage.objects
  for insert with check (
    bucket_id = 'evidence-files'
    and exists (
      select 1 from events e
      where e.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and has_permission('evidence.log', e.organisation_id, e.client_id, e.id)
    )
  );
