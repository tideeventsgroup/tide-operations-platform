do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(procedure.oid) into function_definition
  from pg_proc procedure
  where procedure.oid = 'public.transition_incident(uuid, integer, text, text, text, uuid)'::regprocedure;

  if function_definition is null or position('where incident_id = v_incident.id' in function_definition) = 0 then
    raise exception 'Expected transition timeline lookup was not found';
  end if;

  execute replace(
    function_definition,
    'where incident_id = v_incident.id',
    'where public.incident_timeline_entries.incident_id = v_incident.id'
  );
end;
$$;
