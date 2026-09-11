-- Restore 'incident.transitioned' to the incident audit action constraint.
--
-- 20260910220000_incident_archive.sql dropped the existing check constraint and
-- rebuilt it from a partial list, silently omitting the value that
-- transition_incident() writes. Later migrations widened the list again for
-- timeline, action and decision events, but never restored this one.
--
-- Effect in production: every incident status and severity change failed. An
-- incident could be reported but never assessed, escalated, resolved or closed,
-- because transition_incident() writes its audit row inside the same
-- transaction as the status update, so the constraint violation rolled the
-- whole transition back.
--
-- Found by the pgTAP suite, which was not running in CI.
--
-- The list below is every action written by a live function, verified against
-- the deployed function bodies, plus the values the API routes insert directly.
begin;

alter table public.incident_audit_events
  drop constraint if exists incident_audit_events_action_check;

alter table public.incident_audit_events
  add constraint incident_audit_events_action_check check (
    action in (
      'incident.reported',
      'incident.transitioned',
      'incident.detail_saved',
      'incident.edited',
      'incident.archived',
      'timeline.entry_added',
      'incident.action_created',
      'incident.action_acknowledged',
      'incident.action_completed',
      'incident.action_verified',
      'incident.decision_recorded'
    )
  );

commit;
