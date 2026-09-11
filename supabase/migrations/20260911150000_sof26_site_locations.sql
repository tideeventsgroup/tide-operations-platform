-- Site locations for Stranraer Oyster Festival 2026.
--
-- Before this, the event had four generic zones (A-D) and no named locations, so
-- an operator reporting an incident could only say "Zone A". These are the real
-- marquees and features, supplied by the project owner ahead of go-live.
--
-- Applied directly to production ahead of the event; written idempotently so
-- re-running it, or running it against a fresh database, produces the same
-- result without duplicating rows.
begin;

insert into public.event_locations (event_id, name, location_type)
select e.id, v.name, v.location_type
from public.events e
cross join (values
  ('Entrance / Market Marquee', 'access_point'),
  ('Speakers Marquee',          'named_area'),
  ('Corporate Marquee',         'named_area'),
  ('Kitchen Marquee',           'named_area'),
  ('Bar/Entertainment Marquee', 'named_area'),
  ('Kids Marquee',              'named_area'),
  ('Toilets',                   'named_area')
) as v(name, location_type)
where e.display_reference = 'TEG-EVT-2026-0001'
  and not exists (
    select 1 from public.event_locations existing
    where existing.event_id = e.id and existing.name = v.name
  );

commit;
