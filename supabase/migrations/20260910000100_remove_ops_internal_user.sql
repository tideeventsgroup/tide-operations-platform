begin;

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from public.internal_users where username = 'ops';
  if v_user_id is null then return; end if;

  delete from public.internal_users where id = v_user_id;
  delete from auth.users where id = v_user_id;
end;
$$;

commit;
