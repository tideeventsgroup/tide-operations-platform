-- Guarded transitions, same pattern as the incident module. Uses the
-- document.* permissions already seeded in 0006 — no new permission
-- codes needed.

create function create_document(
  p_event_id uuid,
  p_document_type_id uuid,
  p_title text,
  p_classification classification_level default 'internal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_document_id uuid;
  v_reference text;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('document.create', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to create documents on this event';
  end if;
  if not exists (select 1 from document_types where id = p_document_type_id and organisation_id = v_event.organisation_id) then
    raise exception 'Unknown document type for this organisation';
  end if;

  v_reference := next_event_reference(p_event_id, 'DOC');

  insert into documents (organisation_id, event_id, document_type_id, reference, title, classification, created_by)
  values (v_event.organisation_id, p_event_id, p_document_type_id, v_reference, p_title, p_classification, auth.uid())
  returning id into v_document_id;

  insert into document_status_history (document_id, from_status, to_status, changed_by)
  values (v_document_id, null, 'draft', auth.uid());

  perform record_audit_event('document', v_document_id, 'created', p_event_id := p_event_id,
    p_after_state := jsonb_build_object('reference', v_reference, 'title', p_title));

  return v_document_id;
end;
$$;

create function register_document_version(
  p_document_id uuid,
  p_storage_path text,
  p_file_name text,
  p_file_size bigint default null,
  p_mime_type text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document documents%rowtype;
  v_version_id uuid;
  v_next_version int;
  v_previous_status document_status;
begin
  select * into v_document from documents where id = p_document_id;
  if v_document.id is null then raise exception 'Document not found'; end if;
  if not has_permission('document.update', v_document.organisation_id, null, v_document.event_id) then
    raise exception 'Not authorised to update this document';
  end if;
  if v_document.status = 'archived' then
    raise exception 'Cannot add a version to an archived document';
  end if;

  select coalesce(max(version_no), 0) + 1 into v_next_version from document_versions where document_id = p_document_id;

  insert into document_versions (document_id, version_no, storage_path, file_name, file_size, mime_type, notes, uploaded_by)
  values (p_document_id, v_next_version, p_storage_path, p_file_name, p_file_size, p_mime_type, p_notes, auth.uid())
  returning id into v_version_id;

  v_previous_status := v_document.status;

  update documents set
    current_version_id = v_version_id,
    status = case when v_document.status in ('approved', 'issued', 'superseded') then 'draft' else v_document.status end,
    approved_by = case when v_document.status in ('approved', 'issued', 'superseded') then null else approved_by end,
    approved_at = case when v_document.status in ('approved', 'issued', 'superseded') then null else approved_at end,
    issued_by = case when v_document.status in ('approved', 'issued', 'superseded') then null else issued_by end,
    issued_at = case when v_document.status in ('approved', 'issued', 'superseded') then null else issued_at end
  where id = p_document_id;

  if v_previous_status in ('approved', 'issued', 'superseded') then
    insert into document_status_history (document_id, from_status, to_status, reason, changed_by)
    values (p_document_id, v_previous_status, 'draft', 'New version uploaded (v' || v_next_version || ')', auth.uid());
  end if;

  return v_version_id;
end;
$$;

create function submit_document_for_review(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document documents%rowtype;
begin
  select * into v_document from documents where id = p_document_id;
  if v_document.id is null then raise exception 'Document not found'; end if;
  if not has_permission('document.update', v_document.organisation_id, null, v_document.event_id) then
    raise exception 'Not authorised to update this document';
  end if;
  if v_document.status <> 'draft' then
    raise exception 'Only a draft document can be submitted for review';
  end if;
  if v_document.current_version_id is null then
    raise exception 'Upload a file before submitting for review';
  end if;

  update documents set status = 'in_review' where id = p_document_id;
  insert into document_status_history (document_id, from_status, to_status, changed_by)
  values (p_document_id, 'draft', 'in_review', auth.uid());
end;
$$;

create function approve_document(p_document_id uuid, p_comments text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document documents%rowtype;
begin
  select * into v_document from documents where id = p_document_id;
  if v_document.id is null then raise exception 'Document not found'; end if;
  if not has_permission('document.approve', v_document.organisation_id, null, v_document.event_id) then
    raise exception 'Not authorised to approve this document';
  end if;
  if v_document.status <> 'in_review' then
    raise exception 'Only a document in review can be approved';
  end if;

  update documents set status = 'approved', approved_by = auth.uid(), approved_at = now() where id = p_document_id;
  insert into document_status_history (document_id, from_status, to_status, reason, changed_by)
  values (p_document_id, 'in_review', 'approved', p_comments, auth.uid());

  perform record_audit_event('document', p_document_id, 'approved', p_event_id := v_document.event_id, p_reason := p_comments);
end;
$$;

create function issue_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document documents%rowtype;
begin
  select * into v_document from documents where id = p_document_id;
  if v_document.id is null then raise exception 'Document not found'; end if;
  if not has_permission('document.issue', v_document.organisation_id, null, v_document.event_id) then
    raise exception 'Not authorised to issue this document';
  end if;
  if v_document.status <> 'approved' then
    raise exception 'Only an approved document can be issued';
  end if;

  update documents set status = 'issued', issued_by = auth.uid(), issued_at = now() where id = p_document_id;
  insert into document_status_history (document_id, from_status, to_status, changed_by)
  values (p_document_id, 'approved', 'issued', auth.uid());

  perform record_audit_event('document', p_document_id, 'issued', p_event_id := v_document.event_id);
end;
$$;

create function archive_document(p_document_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document documents%rowtype;
begin
  select * into v_document from documents where id = p_document_id;
  if v_document.id is null then raise exception 'Document not found'; end if;
  if not has_permission('document.administer', v_document.organisation_id, null, v_document.event_id) then
    raise exception 'Not authorised to archive this document';
  end if;
  if v_document.status = 'archived' then
    raise exception 'Document is already archived';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A reason is required to archive a document';
  end if;

  update documents set status = 'archived' where id = p_document_id;
  insert into document_status_history (document_id, from_status, to_status, reason, changed_by)
  values (p_document_id, v_document.status, 'archived', p_reason, auth.uid());

  perform record_audit_event('document', p_document_id, 'archived', p_event_id := v_document.event_id, p_reason := p_reason);
end;
$$;

revoke execute on function create_document(uuid, uuid, text, classification_level) from public, anon, authenticated;
revoke execute on function register_document_version(uuid, text, text, bigint, text, text) from public, anon, authenticated;
revoke execute on function submit_document_for_review(uuid) from public, anon, authenticated;
revoke execute on function approve_document(uuid, text) from public, anon, authenticated;
revoke execute on function issue_document(uuid) from public, anon, authenticated;
revoke execute on function archive_document(uuid, text) from public, anon, authenticated;

grant execute on function create_document(uuid, uuid, text, classification_level) to authenticated;
grant execute on function register_document_version(uuid, text, text, bigint, text, text) to authenticated;
grant execute on function submit_document_for_review(uuid) to authenticated;
grant execute on function approve_document(uuid, text) to authenticated;
grant execute on function issue_document(uuid) to authenticated;
grant execute on function archive_document(uuid, text) to authenticated;
