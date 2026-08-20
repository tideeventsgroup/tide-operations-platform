alter table observations enable row level security;

create policy observations_select on observations
  for select using (has_permission('observation.view', organisation_id, null, event_id));
