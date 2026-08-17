-- Capture first_name/surname supplied at sign-up (auth.signUp options.data)
-- instead of discarding it and asking the user again after admin approval.

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, surname)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'surname'
  );
  return new;
end;
$$;
