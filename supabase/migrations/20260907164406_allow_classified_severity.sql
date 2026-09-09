alter table public.incidents drop constraint incidents_severity_check;
alter table public.incidents add constraint incidents_severity_check check (
  severity in ('unknown', 'low', 'moderate', 'high', 'critical')
);
