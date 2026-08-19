alter table document_types enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_status_history enable row level security;

create policy document_types_select on document_types
  for select using (is_staff() and organisation_id = current_organisation_id());
create policy document_types_admin_write on document_types
  for all using (is_admin() and organisation_id = current_organisation_id())
  with check (is_admin() and organisation_id = current_organisation_id());

-- documents: select gated on document.view. Classification is informational
-- here (spec's "restricted split into a separate table" pattern applies to
-- welfare/medical data, not general documents) — a future tighter tier
-- would add a document.view_restricted permission rather than relaxing this.
create policy documents_select on documents
  for select using (organisation_id = current_organisation_id() and has_permission('document.view', organisation_id, null, event_id));
-- No direct INSERT/UPDATE/DELETE policy: all writes go through the
-- guarded functions in 0039, which are SECURITY DEFINER and bypass RLS.

create policy document_versions_select on document_versions
  for select using (exists (
    select 1 from documents d where d.id = document_id and has_permission('document.view', d.organisation_id, null, d.event_id)
  ));

create policy document_status_history_select on document_status_history
  for select using (exists (
    select 1 from documents d where d.id = document_id and has_permission('document.view', d.organisation_id, null, d.event_id)
  ));

-- Storage: the 'event-files' bucket already existed with RLS enabled and
-- no policies (deny-all) — Document Studio is its first real user. Path
-- convention: documents/{event_id}/{document_id}/{filename}. Both SELECT
-- and INSERT resolve the event from the path and re-run the same
-- has_permission() checks as the table policies above, so a signed-in
-- user without document access can't reach the file even with a direct
-- Storage URL.
create policy document_files_select on storage.objects
  for select using (
    bucket_id = 'event-files'
    and (storage.foldername(name))[1] = 'documents'
    and exists (
      select 1 from events e
      where e.id = ((storage.foldername(name))[2])::uuid
      and has_permission('document.view', e.organisation_id, e.client_id, e.id)
    )
  );

create policy document_files_insert on storage.objects
  for insert with check (
    bucket_id = 'event-files'
    and (storage.foldername(name))[1] = 'documents'
    and exists (
      select 1 from events e
      where e.id = ((storage.foldername(name))[2])::uuid
      and has_permission('document.create', e.organisation_id, e.client_id, e.id)
    )
  );
