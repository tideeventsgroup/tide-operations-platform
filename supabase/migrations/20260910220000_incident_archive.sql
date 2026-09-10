begin;
alter table public.incidents add column archived_at timestamptz, add column archived_by uuid references public.internal_users(id) on delete restrict, add column archive_reason text;
alter table public.incidents add constraint incidents_archive_fields check ((archived_at is null and archived_by is null and archive_reason is null) or (archived_at is not null and archived_by is not null and char_length(btrim(archive_reason)) between 1 and 1000));
create index incidents_live_event_reported_idx on public.incidents(event_id, reported_at desc) where archived_at is null;
alter table public.incident_audit_events drop constraint if exists incident_audit_events_action_check;
alter table public.incident_audit_events add constraint incident_audit_events_action_check check (action in ('incident.reported','incident.detail_saved','incident.edited','incident.archived'));
commit;
