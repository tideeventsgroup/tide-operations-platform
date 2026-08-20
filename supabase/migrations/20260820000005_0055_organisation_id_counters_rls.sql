-- Same treatment as event_id_counters/id_counters: RLS enabled, no policies
-- (default deny). Never queried directly by application code, only via
-- next_organisation_reference() which is SECURITY DEFINER and bypasses RLS.
alter table organisation_id_counters enable row level security;
