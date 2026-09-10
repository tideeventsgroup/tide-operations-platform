-- The mobile quick path has exactly five operator inputs: category, location
-- or zone, severity, description and immediate assistance. It creates the
-- existing auditable incident aggregate, then records its extra quick fields.

begin;

alter table public.incidents
  add column subcategory_id uuid references public.incident_categories (id) on delete restrict,
  add column immediate_assistance_required boolean not null default false;

create index incidents_event_assistance_idx
  on public.incidents (event_id, reported_at desc)
  where immediate_assistance_required;

create function public.create_incident_report(
  p_actor_id uuid, p_event_id uuid, p_entry_mode text, p_title text,
  p_initial_report text, p_report_source text, p_occurred_at timestamptz,
  p_category_id uuid, p_subcategory_id uuid, p_location_id uuid, p_zone_id uuid,
  p_severity text, p_immediate_assistance_required boolean, p_idempotency_key uuid
)
returns table (incident_id uuid, incident_reference text, receipt_id uuid, created boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_result record; v_report text := nullif(btrim(p_initial_report), '');
begin
  if p_entry_mode = 'quick' and (p_category_id is null or (p_location_id is null and p_zone_id is null) or coalesce(p_severity, 'unknown') = 'unknown' or v_report is null or p_immediate_assistance_required is null) then
    raise exception 'Quick reports require category, location or zone, severity, description, and assistance status' using errcode = '22023';
  end if;
  if p_category_id is not null and not exists (select 1 from public.incident_categories where id = p_category_id and parent_id is null and is_active) then
    raise exception 'The incident category is unavailable' using errcode = '22023';
  end if;
  if p_subcategory_id is not null and not exists (select 1 from public.incident_categories where id = p_subcategory_id and parent_id = p_category_id and is_active) then
    raise exception 'The incident sub-category is unavailable' using errcode = '22023';
  end if;

  select * into v_result from public.create_incident_report(p_actor_id, p_event_id, p_entry_mode, p_title, p_initial_report, p_report_source, p_occurred_at, p_category_id, p_location_id, p_zone_id, p_severity, p_idempotency_key);
  if v_result.created then
    update public.incidents set subcategory_id = p_subcategory_id, immediate_assistance_required = p_immediate_assistance_required where id = v_result.incident_id;
  end if;
  return query select v_result.incident_id, v_result.incident_reference, v_result.receipt_id, v_result.created;
end;
$$;

revoke all on function public.create_incident_report(uuid, uuid, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, text, boolean, uuid) from public, anon, authenticated;
grant execute on function public.create_incident_report(uuid, uuid, text, text, text, text, timestamptz, uuid, uuid, uuid, uuid, text, boolean, uuid) to service_role;

commit;
