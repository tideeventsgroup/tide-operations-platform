create table public.capabilities (
  id text primary key check (id ~ '^[a-z]+\.[a-z_]+$'),
  description text not null check (char_length(description) between 1 and 240)
);

create table public.role_capabilities (
  role public.app_role not null,
  capability_id text not null references public.capabilities (id) on delete cascade,
  primary key (role, capability_id)
);

insert into public.capabilities (id, description) values
  ('event.read', 'View authorised event records.'),
  ('event.manage', 'Create or manage event configuration and access.'),
  ('incident.read', 'View authorised incident records.'),
  ('incident.create', 'Create an incident report.'),
  ('incident.manage', 'Assess, assign, transition, or close incidents.'),
  ('timeline.append', 'Append an operational timeline entry.'),
  ('action.manage', 'Create, assign, complete, or verify actions.'),
  ('decision.record', 'Record operational decisions and rationale.'),
  ('resource.manage', 'Assign and update operational resources.'),
  ('audit.read', 'Read authorised audit history.')
on conflict do nothing;

insert into public.role_capabilities (role, capability_id) values
  ('organisation_admin', 'event.read'),
  ('organisation_admin', 'event.manage'),
  ('organisation_admin', 'incident.read'),
  ('organisation_admin', 'incident.create'),
  ('organisation_admin', 'incident.manage'),
  ('organisation_admin', 'timeline.append'),
  ('organisation_admin', 'action.manage'),
  ('organisation_admin', 'decision.record'),
  ('organisation_admin', 'resource.manage'),
  ('organisation_admin', 'audit.read'),
  ('event_manager', 'event.read'),
  ('event_manager', 'event.manage'),
  ('event_manager', 'incident.read'),
  ('event_manager', 'incident.create'),
  ('event_manager', 'incident.manage'),
  ('event_manager', 'timeline.append'),
  ('event_manager', 'action.manage'),
  ('event_manager', 'decision.record'),
  ('event_manager', 'resource.manage'),
  ('event_manager', 'audit.read'),
  ('event_control_manager', 'event.read'),
  ('event_control_manager', 'incident.read'),
  ('event_control_manager', 'incident.create'),
  ('event_control_manager', 'incident.manage'),
  ('event_control_manager', 'timeline.append'),
  ('event_control_manager', 'action.manage'),
  ('event_control_manager', 'decision.record'),
  ('event_control_manager', 'resource.manage'),
  ('event_control_manager', 'audit.read'),
  ('event_control_operator', 'event.read'),
  ('event_control_operator', 'incident.read'),
  ('event_control_operator', 'incident.create'),
  ('event_control_operator', 'timeline.append'),
  ('event_control_operator', 'action.manage'),
  ('event_control_operator', 'decision.record'),
  ('field_reporter', 'event.read'),
  ('field_reporter', 'incident.create'),
  ('field_reporter', 'timeline.append'),
  ('client_user', 'event.read'),
  ('read_only', 'event.read'),
  ('read_only', 'incident.read'),
  ('auditor', 'event.read'),
  ('auditor', 'incident.read'),
  ('auditor', 'audit.read')
on conflict do nothing;

alter table public.capabilities enable row level security;
alter table public.role_capabilities enable row level security;

create policy "capabilities select authenticated" on public.capabilities
  for select to authenticated using (true);
create policy "role capabilities select authenticated" on public.role_capabilities
  for select to authenticated using (true);

grant select on public.capabilities to authenticated;
grant select on public.role_capabilities to authenticated;
