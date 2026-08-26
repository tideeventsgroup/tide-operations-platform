-- Event Categories (global, no organisation_id)

create function create_event_category(p_code text, p_name text, p_sort_order int default 0)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('organisation.administer', current_organisation_id(), null, null) then
    raise exception 'Not authorised to manage event categories';
  end if;
  if exists (select 1 from event_categories where code = p_code) then
    raise exception 'A category with code "%" already exists.', p_code;
  end if;

  insert into event_categories (code, name, is_system, sort_order)
  values (p_code, p_name, false, p_sort_order);

  return p_code;
end;
$$;

create function update_event_category(p_code text, p_name text, p_sort_order int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('organisation.administer', current_organisation_id(), null, null) then
    raise exception 'Not authorised to manage event categories';
  end if;
  if not exists (select 1 from event_categories where code = p_code) then
    raise exception 'Event category not found.';
  end if;

  update event_categories set name = p_name, sort_order = p_sort_order where code = p_code;
end;
$$;

create function delete_event_category(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category event_categories%rowtype;
  v_count int;
begin
  if not has_permission('organisation.administer', current_organisation_id(), null, null) then
    raise exception 'Not authorised to manage event categories';
  end if;

  select * into v_category from event_categories where code = p_code;
  if v_category.code is null then raise exception 'Event category not found.'; end if;
  if v_category.is_system then raise exception 'System categories cannot be deleted. Rename it instead.'; end if;

  select count(*) into v_count from events where category_code = p_code;
  if v_count > 0 then
    raise exception '% event(s) are filed under this category. Reassign them first.', v_count;
  end if;

  delete from event_categories where code = p_code;
end;
$$;

-- Characteristic Types (global, no organisation_id)

create function create_characteristic_type(p_code text, p_name text, p_sort_order int default 0)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('organisation.administer', current_organisation_id(), null, null) then
    raise exception 'Not authorised to manage characteristic types';
  end if;
  if exists (select 1 from characteristic_types where code = p_code) then
    raise exception 'A characteristic type with code "%" already exists.', p_code;
  end if;

  insert into characteristic_types (code, name, is_system, sort_order)
  values (p_code, p_name, false, p_sort_order);

  return p_code;
end;
$$;

create function update_characteristic_type(p_code text, p_name text, p_sort_order int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('organisation.administer', current_organisation_id(), null, null) then
    raise exception 'Not authorised to manage characteristic types';
  end if;
  if not exists (select 1 from characteristic_types where code = p_code) then
    raise exception 'Characteristic type not found.';
  end if;

  update characteristic_types set name = p_name, sort_order = p_sort_order where code = p_code;
end;
$$;

create function delete_characteristic_type(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type characteristic_types%rowtype;
  v_count int;
begin
  if not has_permission('organisation.administer', current_organisation_id(), null, null) then
    raise exception 'Not authorised to manage characteristic types';
  end if;

  select * into v_type from characteristic_types where code = p_code;
  if v_type.code is null then raise exception 'Characteristic type not found.'; end if;
  if v_type.is_system then raise exception 'System characteristic types cannot be deleted.'; end if;

  select count(*) into v_count from operation_characteristics where characteristic_code = p_code;
  if v_count > 0 then
    raise exception '% operation(s) carry this characteristic. Remove it from them first.', v_count;
  end if;

  delete from characteristic_types where code = p_code;
end;
$$;

-- Event Priorities (organisation-scoped, PK (organisation_id, code))

create function create_event_priority(
  p_organisation_id uuid,
  p_code text,
  p_name text,
  p_description text,
  p_rank int,
  p_color_token text default 'destructive',
  p_target_ack_minutes int default null,
  p_target_resolve_minutes int default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('organisation.administer', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage event priorities';
  end if;
  if p_color_token not in ('destructive', 'warning', 'info', 'success', 'muted') then
    raise exception 'Unknown colour token "%".', p_color_token;
  end if;
  if p_target_ack_minutes is not null and p_target_ack_minutes <= 0 then
    raise exception 'Target acknowledge time must be greater than zero.';
  end if;
  if p_target_resolve_minutes is not null and p_target_resolve_minutes <= 0 then
    raise exception 'Target resolve time must be greater than zero.';
  end if;
  if exists (select 1 from event_priorities where organisation_id = p_organisation_id and code = p_code) then
    raise exception 'A priority with code "%" already exists.', p_code;
  end if;

  insert into event_priorities (organisation_id, code, name, description, rank, color_token, target_ack_minutes, target_resolve_minutes)
  values (p_organisation_id, p_code, p_name, p_description, p_rank, p_color_token, p_target_ack_minutes, p_target_resolve_minutes);

  return p_code;
end;
$$;

create function update_event_priority(
  p_organisation_id uuid,
  p_code text,
  p_name text,
  p_description text,
  p_rank int,
  p_color_token text,
  p_target_ack_minutes int,
  p_target_resolve_minutes int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('organisation.administer', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage event priorities';
  end if;
  if p_color_token not in ('destructive', 'warning', 'info', 'success', 'muted') then
    raise exception 'Unknown colour token "%".', p_color_token;
  end if;
  if not exists (select 1 from event_priorities where organisation_id = p_organisation_id and code = p_code) then
    raise exception 'Priority not found.';
  end if;

  update event_priorities
  set name = p_name, description = p_description, rank = p_rank, color_token = p_color_token,
      target_ack_minutes = p_target_ack_minutes, target_resolve_minutes = p_target_resolve_minutes
  where organisation_id = p_organisation_id and code = p_code;
end;
$$;

create function delete_event_priority(p_organisation_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_total int;
begin
  if not has_permission('organisation.administer', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage event priorities';
  end if;
  if not exists (select 1 from event_priorities where organisation_id = p_organisation_id and code = p_code) then
    raise exception 'Priority not found.';
  end if;

  select count(*) into v_count from events where organisation_id = p_organisation_id and priority_code = p_code;
  if v_count > 0 then
    raise exception '% event(s) are set to this priority. Reassign them first.', v_count;
  end if;

  select count(*) into v_total from event_priorities where organisation_id = p_organisation_id;
  if v_total <= 1 then
    raise exception 'An organisation must keep at least one event priority.';
  end if;

  delete from event_priorities where organisation_id = p_organisation_id and code = p_code;
end;
$$;

-- Control Roles (organisation-scoped, uuid PK)

create function create_control_role(p_organisation_id uuid, p_code text, p_name text, p_sort_order int default 0)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not has_permission('organisation.administer', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage control roles';
  end if;
  if exists (select 1 from operation_control_roles where organisation_id = p_organisation_id and code = p_code) then
    raise exception 'A control role with code "%" already exists.', p_code;
  end if;

  insert into operation_control_roles (organisation_id, code, name, sort_order)
  values (p_organisation_id, p_code, p_name, p_sort_order)
  returning id into v_id;

  return v_id;
end;
$$;

create function update_control_role(p_id uuid, p_name text, p_sort_order int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role operation_control_roles%rowtype;
begin
  select * into v_role from operation_control_roles where id = p_id;
  if v_role.id is null then raise exception 'Control role not found.'; end if;
  if not has_permission('organisation.administer', v_role.organisation_id, null, null) then
    raise exception 'Not authorised to manage control roles';
  end if;

  update operation_control_roles set name = p_name, sort_order = p_sort_order where id = p_id;
end;
$$;

create function delete_control_role(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role operation_control_roles%rowtype;
  v_count int;
begin
  select * into v_role from operation_control_roles where id = p_id;
  if v_role.id is null then raise exception 'Control role not found.'; end if;
  if not has_permission('organisation.administer', v_role.organisation_id, null, null) then
    raise exception 'Not authorised to manage control roles';
  end if;

  select count(*) into v_count from operation_control_sessions where role_id = p_id;
  if v_count > 0 then
    raise exception '% control-room session(s) were signed on under this role. It cannot be deleted without breaking the duty-roster history.', v_count;
  end if;

  delete from operation_control_roles where id = p_id;
end;
$$;

-- Document Types (organisation-scoped, uuid PK)

create function create_document_type(p_organisation_id uuid, p_code text, p_name text, p_description text default null, p_sort_order int default 0)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not has_permission('organisation.administer', p_organisation_id, null, null) then
    raise exception 'Not authorised to manage document types';
  end if;
  if exists (select 1 from document_types where organisation_id = p_organisation_id and code = p_code) then
    raise exception 'A document type with code "%" already exists.', p_code;
  end if;

  insert into document_types (organisation_id, code, name, description, sort_order)
  values (p_organisation_id, p_code, p_name, p_description, p_sort_order)
  returning id into v_id;

  return v_id;
end;
$$;

create function update_document_type(p_id uuid, p_name text, p_description text, p_sort_order int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type document_types%rowtype;
begin
  select * into v_type from document_types where id = p_id;
  if v_type.id is null then raise exception 'Document type not found.'; end if;
  if not has_permission('organisation.administer', v_type.organisation_id, null, null) then
    raise exception 'Not authorised to manage document types';
  end if;

  update document_types set name = p_name, description = p_description, sort_order = p_sort_order where id = p_id;
end;
$$;

create function delete_document_type(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type document_types%rowtype;
  v_count int;
begin
  select * into v_type from document_types where id = p_id;
  if v_type.id is null then raise exception 'Document type not found.'; end if;
  if not has_permission('organisation.administer', v_type.organisation_id, null, null) then
    raise exception 'Not authorised to manage document types';
  end if;

  select count(*) into v_count from documents where document_type_id = p_id;
  if v_count > 0 then
    raise exception '% document(s) use this type. Reassign or delete them first.', v_count;
  end if;

  delete from document_types where id = p_id;
end;
$$;

revoke execute on function create_event_category(text, text, int) from public, anon, authenticated;
revoke execute on function update_event_category(text, text, int) from public, anon, authenticated;
revoke execute on function delete_event_category(text) from public, anon, authenticated;
revoke execute on function create_characteristic_type(text, text, int) from public, anon, authenticated;
revoke execute on function update_characteristic_type(text, text, int) from public, anon, authenticated;
revoke execute on function delete_characteristic_type(text) from public, anon, authenticated;
revoke execute on function create_event_priority(uuid, text, text, text, int, text, int, int) from public, anon, authenticated;
revoke execute on function update_event_priority(uuid, text, text, text, int, text, int, int) from public, anon, authenticated;
revoke execute on function delete_event_priority(uuid, text) from public, anon, authenticated;
revoke execute on function create_control_role(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function update_control_role(uuid, text, int) from public, anon, authenticated;
revoke execute on function delete_control_role(uuid) from public, anon, authenticated;
revoke execute on function create_document_type(uuid, text, text, text, int) from public, anon, authenticated;
revoke execute on function update_document_type(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function delete_document_type(uuid) from public, anon, authenticated;

grant execute on function create_event_category(text, text, int) to authenticated;
grant execute on function update_event_category(text, text, int) to authenticated;
grant execute on function delete_event_category(text) to authenticated;
grant execute on function create_characteristic_type(text, text, int) to authenticated;
grant execute on function update_characteristic_type(text, text, int) to authenticated;
grant execute on function delete_characteristic_type(text) to authenticated;
grant execute on function create_event_priority(uuid, text, text, text, int, text, int, int) to authenticated;
grant execute on function update_event_priority(uuid, text, text, text, int, text, int, int) to authenticated;
grant execute on function delete_event_priority(uuid, text) to authenticated;
grant execute on function create_control_role(uuid, text, text, int) to authenticated;
grant execute on function update_control_role(uuid, text, int) to authenticated;
grant execute on function delete_control_role(uuid) to authenticated;
grant execute on function create_document_type(uuid, text, text, text, int) to authenticated;
grant execute on function update_document_type(uuid, text, text, int) to authenticated;
grant execute on function delete_document_type(uuid) to authenticated;
