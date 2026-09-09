do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(procedure.oid) into function_definition
  from pg_proc procedure
  where procedure.oid = 'public.transition_incident(uuid, integer, text, text, text, uuid)'::regprocedure;

  if function_definition is null or position('version = version + 1' in function_definition) = 0 then
    raise exception 'Expected transition version assignment was not found';
  end if;

  execute replace(
    function_definition,
    'version = version + 1',
    'version = public.incidents.version + 1'
  );
end;
$$;
