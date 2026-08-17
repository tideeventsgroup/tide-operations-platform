-- The generated TS Insert type marks `reference` as required (not null,
-- no DB default visible to codegen — it's trigger-assigned), so callers
-- pass an empty string placeholder rather than omitting the field. Treat
-- '' the same as null so the trigger still assigns it.

create or replace function set_client_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := next_reference(new.organisation_id, 'CLI', false);
  end if;
  return new;
end;
$$;

create or replace function set_event_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := next_reference(new.organisation_id, 'EVT', true);
  end if;
  return new;
end;
$$;

revoke execute on function set_client_reference() from public, anon, authenticated;
revoke execute on function set_event_reference() from public, anon, authenticated;
