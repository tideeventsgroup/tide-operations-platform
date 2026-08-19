-- 0040's storage.objects policies had a column-shadowing bug: inside the
-- correlated EXISTS subquery `from events e`, the bare identifier `name`
-- resolved to events.name (the event's title text) instead of the outer
-- storage.objects.name (the file path) — events happens to have its own
-- `name` column. storage.foldername(events.name) never produced a UUID
-- second segment, so the EXISTS was always false and every upload was
-- rejected with "new row violates row-level security policy", caught
-- during Document Studio verification. Fix: qualify every reference to
-- the object path as storage.objects.name explicitly.

drop policy document_files_select on storage.objects;
drop policy document_files_insert on storage.objects;

create policy document_files_select on storage.objects
  for select using (
    bucket_id = 'event-files'
    and (storage.foldername(storage.objects.name))[1] = 'documents'
    and exists (
      select 1 from events e
      where e.id = ((storage.foldername(storage.objects.name))[2])::uuid
      and has_permission('document.view', e.organisation_id, e.client_id, e.id)
    )
  );

create policy document_files_insert on storage.objects
  for insert with check (
    bucket_id = 'event-files'
    and (storage.foldername(storage.objects.name))[1] = 'documents'
    and exists (
      select 1 from events e
      where e.id = ((storage.foldername(storage.objects.name))[2])::uuid
      and has_permission('document.create', e.organisation_id, e.client_id, e.id)
    )
  );
