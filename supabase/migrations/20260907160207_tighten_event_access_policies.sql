drop policy "events manage admins" on public.events;

create policy "events create admins" on public.events
  for insert to authenticated with check (
    app_private.is_organisation_admin(organisation_id)
    and created_by = (select auth.uid())
  );

create policy "events update admins" on public.events
  for update to authenticated using (app_private.is_organisation_admin(organisation_id))
  with check (app_private.is_organisation_admin(organisation_id));
