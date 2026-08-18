-- Cosmetic fix: the permanent timeline entry for a resource status change
-- was rendering the raw enum value ('on_scene', 'stood_down') instead of
-- readable text. Timeline entries are append-only and get read by humans
-- during and after an incident, so this is worth a follow-up migration
-- rather than living with 'on_scene' forever.

create or replace function update_incident_resource_status(p_resource_id uuid, p_status incident_resource_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resource incident_resources%rowtype;
  v_incident incidents%rowtype;
  v_entry_type incident_log_entry_type;
  v_status_label text;
begin
  select * into v_resource from incident_resources where id = p_resource_id;
  if v_resource.id is null then raise exception 'Resource not found'; end if;
  select * into v_incident from incidents where id = v_resource.incident_id;
  if not has_permission('incident.assign', v_incident.organisation_id, null, v_incident.event_id) then
    raise exception 'Not authorised to dispatch resources on this incident';
  end if;
  if v_resource.status = 'stood_down' then
    raise exception 'Resource is already stood down';
  end if;
  if p_status = v_resource.status then
    raise exception 'Resource is already in that status';
  end if;

  update incident_resources set
    status = p_status,
    dispatched_at = case when p_status = 'dispatched' then now() else dispatched_at end,
    arrived_at = case when p_status = 'on_scene' then now() else arrived_at end,
    stood_down_at = case when p_status = 'stood_down' then now() else stood_down_at end
  where id = p_resource_id;

  v_entry_type := case p_status
    when 'on_scene' then 'arrival'
    when 'dispatched' then 'dispatch'
    else 'system'
  end;

  v_status_label := case p_status
    when 'on_scene' then 'on scene'
    when 'stood_down' then 'stood down'
    else p_status::text
  end;

  insert into incident_log_entries (incident_id, entry_type, body, author_id, linked_record_type, linked_record_id)
  values (v_resource.incident_id, v_entry_type, format('Resource %s: %s', v_status_label, v_resource.resource_type),
    auth.uid(), 'incident_resource', p_resource_id);
end;
$$;
