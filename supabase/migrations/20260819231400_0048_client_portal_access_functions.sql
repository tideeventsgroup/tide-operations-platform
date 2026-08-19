-- Phase 10: Client Portal. Two staff-side controls: toggling portal
-- visibility for an event, and granting an existing profile event-scoped
-- portal access (the same event_id-scoping fix just applied to
-- approveUser() in the admin panel — see that action's comment. This is
-- the path for granting a client contact access to an ADDITIONAL event
-- after their account already exists).

create function set_event_portal_enabled(p_event_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('event.administer', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to administer this event';
  end if;

  update events set portal_enabled = p_enabled where id = p_event_id;

  perform record_audit_event('event', p_event_id, 'portal_enabled_changed', p_event_id := p_event_id,
    p_after_state := jsonb_build_object('portal_enabled', p_enabled));
end;
$$;

create function grant_event_portal_access(p_event_id uuid, p_email text, p_role_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_role roles%rowtype;
  v_profile profiles%rowtype;
  v_user_role_id uuid;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then raise exception 'Event not found'; end if;
  if not has_permission('event.administer', v_event.organisation_id, v_event.client_id, v_event.id) then
    raise exception 'Not authorised to administer this event';
  end if;

  select * into v_role from roles where id = p_role_id;
  if v_role.id is null then raise exception 'Unknown role'; end if;
  if not v_role.is_external then
    raise exception 'Only external roles can be granted portal access here — use Admin > Users for staff roles';
  end if;

  select * into v_profile from profiles where lower(email) = lower(p_email);
  if v_profile.id is null then
    raise exception 'No account found for that email — they must sign up via Request Access first';
  end if;
  if v_profile.account_type = 'staff' then
    raise exception 'This account belongs to a staff member and cannot be granted an external role';
  end if;

  update profiles set
    organisation_id = v_event.organisation_id,
    account_type = coalesce(nullif(account_type, 'pending'), 'client')
  where id = v_profile.id;

  insert into user_roles (user_id, role_id, organisation_id, event_id, granted_by)
  values (v_profile.id, p_role_id, v_event.organisation_id, p_event_id, auth.uid())
  returning id into v_user_role_id;

  perform record_audit_event('user_role', v_user_role_id, 'granted', p_event_id := p_event_id,
    p_after_state := jsonb_build_object('user_id', v_profile.id, 'role_id', p_role_id, 'event_id', p_event_id));

  return v_user_role_id;
end;
$$;

revoke execute on function set_event_portal_enabled(uuid, boolean) from public, anon, authenticated;
revoke execute on function grant_event_portal_access(uuid, text, uuid) from public, anon, authenticated;

grant execute on function set_event_portal_enabled(uuid, boolean) to authenticated;
grant execute on function grant_event_portal_access(uuid, text, uuid) to authenticated;
