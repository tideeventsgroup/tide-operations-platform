revoke execute on function public.create_incident_report(uuid, text, timestamptz, uuid) from public, anon;
revoke execute on function public.transition_incident(uuid, integer, text, text, text, uuid) from public, anon;
grant execute on function public.create_incident_report(uuid, text, timestamptz, uuid) to authenticated;
grant execute on function public.transition_incident(uuid, integer, text, text, text, uuid) to authenticated;

create policy "incident reference sequences deny direct API access" on public.incident_reference_sequences
  for all to authenticated using (false) with check (false);
create policy "operational outbox deny direct API access" on public.operational_outbox
  for all to authenticated using (false) with check (false);
