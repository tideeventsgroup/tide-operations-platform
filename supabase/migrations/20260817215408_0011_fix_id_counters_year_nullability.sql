-- id_counters.year is part of the primary key, so Postgres silently forces
-- it NOT NULL regardless of the column definition — the original
-- next_reference() would have thrown a not-null violation the first time
-- it was called with p_use_year := false (e.g. generating a client
-- reference like TEG-CLI-0001, which has no year component). Use 0 as an
-- explicit "no year" sentinel instead of relying on NULL in a PK column.

create or replace function next_reference(
  p_organisation_id uuid,
  p_entity_type text,
  p_use_year boolean default true,
  p_suffix_width int default 4
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int;
  v_seq bigint;
  v_org_code text;
begin
  v_year := case when p_use_year then extract(year from now())::int else 0 end;

  insert into id_counters (organisation_id, entity_type, year, seq)
  values (p_organisation_id, p_entity_type, v_year, 1)
  on conflict (organisation_id, entity_type, year)
  do update set seq = id_counters.seq + 1
  returning seq into v_seq;

  select code into v_org_code from organisations where id = p_organisation_id;

  if p_use_year then
    return format('%s-%s-%s-%s', v_org_code, p_entity_type, v_year, lpad(v_seq::text, p_suffix_width, '0'));
  else
    return format('%s-%s-%s', v_org_code, p_entity_type, lpad(v_seq::text, p_suffix_width, '0'));
  end if;
end;
$$;

comment on column id_counters.year is '0 is the "no year component" sentinel (year is part of the PK, so NULL cannot be used here) — not a real year.';
