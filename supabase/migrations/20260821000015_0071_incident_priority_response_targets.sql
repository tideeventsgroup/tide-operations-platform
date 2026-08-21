-- Response-time clocks (vision doc): time-to-acknowledge and
-- time-to-resolve targets per priority, so the incident header can show a
-- live clock that colours amber/red as it approaches/exceeds target
-- instead of just an undifferentiated "elapsed" count. Nullable — a
-- priority with no target set just shows a plain clock, no colour coding.

alter table incident_priorities add column target_ack_minutes int;
alter table incident_priorities add column target_resolve_minutes int;

update incident_priorities set target_ack_minutes = 5, target_resolve_minutes = 60 where code = 'P1';
update incident_priorities set target_ack_minutes = 10, target_resolve_minutes = 120 where code = 'P2';
update incident_priorities set target_ack_minutes = 20, target_resolve_minutes = 240 where code = 'P3';
update incident_priorities set target_ack_minutes = 30, target_resolve_minutes = 480 where code = 'P4';
