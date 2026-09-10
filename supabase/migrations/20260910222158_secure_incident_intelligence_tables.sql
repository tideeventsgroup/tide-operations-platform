begin;

alter table public.incident_actions enable row level security;
alter table public.incident_action_events enable row level security;
alter table public.incident_decisions enable row level security;

create index incident_actions_event_idx on public.incident_actions (event_id);
create index incident_actions_assigned_by_idx on public.incident_actions (assigned_by);
create index incident_actions_acknowledged_by_idx on public.incident_actions (acknowledged_by) where acknowledged_by is not null;
create index incident_actions_completed_by_idx on public.incident_actions (completed_by) where completed_by is not null;
create index incident_actions_verified_by_idx on public.incident_actions (verified_by) where verified_by is not null;
create index incident_action_events_event_idx on public.incident_action_events (event_id);
create index incident_action_events_incident_idx on public.incident_action_events (incident_id);
create index incident_action_events_actor_idx on public.incident_action_events (actor_id);
create index incident_decisions_event_idx on public.incident_decisions (event_id);
create index incident_decisions_recorded_by_idx on public.incident_decisions (recorded_by);

commit;
