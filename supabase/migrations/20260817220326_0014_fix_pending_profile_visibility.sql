-- Bug: profiles_select required organisation_id = current_organisation_id(),
-- but pending signups have organisation_id = null (they haven't been
-- assigned an org yet), so admins could never see them to approve. Add an
-- explicit clause for pending accounts, gated on user.administer (the
-- permission that actually lets you approve someone) rather than the
-- weaker user.view, since a pending row has no org to scope by.
--
-- Single-org simplification: any admin can see any pending signup network-
-- wide. Revisit when a second organisation exists — pending accounts will
-- need a routing signal (invite token, email domain) to scope visibility.

drop policy profiles_select on profiles;

create policy profiles_select on profiles
  for select using (
    id = (select auth.uid())
    or (is_staff() and organisation_id = current_organisation_id() and has_permission('user.view'))
    or (account_type = 'pending' and has_permission('user.administer'))
  );
