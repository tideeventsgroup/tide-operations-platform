create function log_evidence_item(
  p_incident_id uuid,
  p_item_type text,
  p_description text,
  p_storage_path text default null,
  p_file_name text default null,
  p_file_size bigint default null,
  p_mime_type text default null,
  p_sha256_hash text default null,
  p_classification classification_level default 'confidential',
  p_collected_by_name text default null,
  p_collected_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident incidents%rowtype;
  v_evidence_id uuid;
  v_reference text;
begin
  select * into v_incident from incidents where id = p_incident_id;
  if v_incident.id is null then raise exception 'Incident not found'; end if;
  if not has_permission('evidence.log', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to log evidence for this incident';
  end if;

  v_reference := next_event_reference(v_incident.event_id, 'EVI');

  insert into evidence_items (
    organisation_id, incident_id, reference, item_type, description, storage_path,
    file_name, file_size, mime_type, sha256_hash, classification, collected_by_name, collected_at, logged_by
  ) values (
    v_incident.organisation_id, p_incident_id, v_reference, p_item_type, p_description, p_storage_path,
    p_file_name, p_file_size, p_mime_type, p_sha256_hash, p_classification, p_collected_by_name, p_collected_at, auth.uid()
  )
  returning id into v_evidence_id;

  insert into evidence_custody_log (evidence_item_id, action, actor_id, notes)
  values (v_evidence_id, 'logged', auth.uid(), p_collected_by_name);

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (p_incident_id, 'attachment', format('Evidence logged: %s (%s)', p_description, p_item_type),
    auth.uid(), 'evidence_item', v_evidence_id);

  perform record_audit_event('evidence_item', v_evidence_id, 'logged', v_incident.organisation_id, v_incident.event_id,
    null, jsonb_build_object('reference', v_reference, 'classification', p_classification), null);

  return v_evidence_id;
end;
$$;

-- Called every time a viewer opens or downloads the underlying file — the
-- actual "logged access" enforcement for restricted evidence, distinct
-- from RLS (which only gates whether a row is returned at all, not
-- whether the read gets recorded). The action-layer signed-URL helper is
-- expected to call this before minting a URL.
create function record_evidence_access(p_evidence_item_id uuid, p_action text default 'viewed')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evidence evidence_items%rowtype;
  v_incident incidents%rowtype;
begin
  select * into v_evidence from evidence_items where id = p_evidence_item_id;
  if v_evidence.id is null then raise exception 'Evidence item not found'; end if;
  select * into v_incident from incidents where id = v_evidence.incident_id;
  if not has_permission('evidence.view', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to view this evidence item';
  end if;
  if p_action not in ('viewed', 'downloaded') then
    raise exception 'Invalid access action';
  end if;

  insert into evidence_custody_log (evidence_item_id, action, actor_id)
  values (p_evidence_item_id, p_action, auth.uid());
end;
$$;

create function update_evidence_status(p_evidence_item_id uuid, p_status evidence_status, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evidence evidence_items%rowtype;
  v_incident incidents%rowtype;
begin
  select * into v_evidence from evidence_items where id = p_evidence_item_id;
  if v_evidence.id is null then raise exception 'Evidence item not found'; end if;
  select * into v_incident from incidents where id = v_evidence.incident_id;
  if not has_permission('evidence.manage', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to manage evidence for this incident';
  end if;
  if v_evidence.status = 'disposed' then
    raise exception 'Evidence has already been disposed';
  end if;
  if p_status in ('released', 'disposed') and coalesce(trim(p_notes), '') = '' then
    raise exception 'A reason is required to release or dispose of evidence';
  end if;

  update evidence_items set status = p_status where id = p_evidence_item_id;

  insert into evidence_custody_log (evidence_item_id, action, actor_id, notes)
  values (p_evidence_item_id, 'status_changed:' || p_status::text, auth.uid(), p_notes);

  perform record_audit_event('evidence_item', p_evidence_item_id, 'status_changed', v_incident.organisation_id, v_incident.event_id,
    jsonb_build_object('status', v_evidence.status), jsonb_build_object('status', p_status), p_notes);
end;
$$;

revoke execute on function log_evidence_item(uuid, text, text, text, text, bigint, text, text, classification_level, text, timestamptz) from public, anon, authenticated;
revoke execute on function record_evidence_access(uuid, text) from public, anon, authenticated;
revoke execute on function update_evidence_status(uuid, evidence_status, text) from public, anon, authenticated;

grant execute on function log_evidence_item(uuid, text, text, text, text, bigint, text, text, classification_level, text, timestamptz) to authenticated;
grant execute on function record_evidence_access(uuid, text) to authenticated;
grant execute on function update_evidence_status(uuid, evidence_status, text) to authenticated;
