-- Foundation for the full operational incident record.  Incidents remain the
-- scan-friendly operational spine; detailed reporting attaches to this record
-- in subsequent migrations.

begin;

alter table public.incident_categories
  add column parent_id uuid references public.incident_categories (id) on delete restrict;

-- The single-organisation migration removed the former composite uniqueness
-- constraint. Codes are now a stable internal taxonomy identifier.
create unique index incident_categories_code_key
  on public.incident_categories (code);

create index incident_categories_parent_label_idx
  on public.incident_categories (parent_id, label)
  where is_active;

insert into public.incident_categories (code, label) values
  ('medical', 'Medical'),
  ('welfare', 'Welfare'),
  ('safeguarding', 'Safeguarding'),
  ('missing_person_child', 'Missing person / child'),
  ('crowd_issue', 'Crowd issue'),
  ('disorder_asb', 'Disorder / ASB'),
  ('security', 'Security'),
  ('suspicious_activity_item', 'Suspicious activity / item'),
  ('crime', 'Crime'),
  ('fire', 'Fire'),
  ('traffic_vehicle', 'Traffic / vehicle'),
  ('infrastructure_site', 'Infrastructure / site'),
  ('weather', 'Weather'),
  ('lost_property', 'Lost property'),
  ('health_safety', 'Health & safety'),
  ('near_miss', 'Near miss'),
  ('complaint', 'Complaint'),
  ('emergency', 'Emergency'),
  ('other', 'Other')
on conflict (code) do update
  set label = excluded.label,
      updated_at = now();

insert into public.incident_categories (code, label, parent_id)
select seed.code, seed.label, parent_category.id
from (
  values
    ('medical_first_aid', 'First aid', 'medical'),
    ('medical_ambulance', 'Ambulance / emergency medical response', 'medical'),
    ('medical_illness', 'Illness', 'medical'),
    ('welfare_distress', 'Person in distress', 'welfare'),
    ('welfare_intoxication', 'Intoxication / vulnerability', 'welfare'),
    ('welfare_welfare_check', 'Welfare check', 'welfare'),
    ('safeguarding_child_concern', 'Child concern', 'safeguarding'),
    ('safeguarding_vulnerable_adult', 'Vulnerable adult concern', 'safeguarding'),
    ('safeguarding_disclosure', 'Disclosure / allegation', 'safeguarding'),
    ('missing_person_child_missing', 'Missing child / young person', 'missing_person_child'),
    ('missing_person_adult_missing', 'Missing adult', 'missing_person_child'),
    ('missing_person_reunited', 'Found / reunited', 'missing_person_child'),
    ('crowd_issue_density', 'Crowd density', 'crowd_issue'),
    ('crowd_issue_queue', 'Queue management', 'crowd_issue'),
    ('crowd_issue_crush_risk', 'Crush / crowd pressure risk', 'crowd_issue'),
    ('disorder_asb_fight', 'Fight / violence', 'disorder_asb'),
    ('disorder_asb_antisocial', 'Antisocial behaviour', 'disorder_asb'),
    ('security_access', 'Access control', 'security'),
    ('security_perimeter', 'Perimeter / entry breach', 'security'),
    ('security_credential', 'Credential issue', 'security'),
    ('suspicious_activity_person', 'Suspicious person', 'suspicious_activity_item'),
    ('suspicious_item', 'Suspicious item', 'suspicious_activity_item'),
    ('crime_theft', 'Theft', 'crime'),
    ('crime_assault', 'Assault', 'crime'),
    ('crime_damage', 'Criminal damage', 'crime'),
    ('fire_alarm', 'Fire alarm activation', 'fire'),
    ('fire_smoke_fire', 'Smoke / fire', 'fire'),
    ('traffic_vehicle_collision', 'Vehicle collision', 'traffic_vehicle'),
    ('traffic_vehicle_access', 'Vehicle access / obstruction', 'traffic_vehicle'),
    ('infrastructure_site_power', 'Power / lighting', 'infrastructure_site'),
    ('infrastructure_site_structure', 'Structure / equipment', 'infrastructure_site'),
    ('infrastructure_site_utilities', 'Utilities', 'infrastructure_site'),
    ('weather_wind', 'Wind', 'weather'),
    ('weather_rain', 'Rain / flooding', 'weather'),
    ('weather_heat_cold', 'Heat / cold', 'weather'),
    ('lost_property_found', 'Property found', 'lost_property'),
    ('lost_property_reported', 'Property reported missing', 'lost_property'),
    ('health_safety_hazard', 'Hazard identified', 'health_safety'),
    ('health_safety_unsafe_act', 'Unsafe act / condition', 'health_safety'),
    ('near_miss_operational', 'Operational near miss', 'near_miss'),
    ('complaint_public', 'Public complaint', 'complaint'),
    ('complaint_staff', 'Staff / contractor complaint', 'complaint'),
    ('emergency_major_incident', 'Major incident / emergency response', 'emergency'),
    ('emergency_evacuation', 'Evacuation', 'emergency'),
    ('other_unclassified', 'Unclassified / other', 'other')
) as seed(code, label, parent_code)
join public.incident_categories parent_category on parent_category.code = seed.parent_code
on conflict (code) do update
  set label = excluded.label,
      parent_id = excluded.parent_id,
      updated_at = now();

alter table public.incidents
  add column confidentiality text not null default 'normal'
    check (confidentiality in ('normal', 'restricted', 'safeguarding'));

create function public.classify_incident_confidentiality()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_primary_code text;
begin
  if new.category_id is null then
    return new;
  end if;

  select coalesce(parent_category.code, category.code)
    into v_primary_code
  from public.incident_categories category
  left join public.incident_categories parent_category on parent_category.id = category.parent_id
  where category.id = new.category_id;

  if v_primary_code in ('safeguarding', 'missing_person_child') then
    new.confidentiality := 'safeguarding';
  end if;

  return new;
end;
$$;

create trigger incidents_classify_confidentiality
before insert or update of category_id on public.incidents
for each row execute function public.classify_incident_confidentiality();

-- Existing records may have gained a category before this trigger existed.
update public.incidents incident
set confidentiality = 'safeguarding'
from public.incident_categories category
left join public.incident_categories parent_category on parent_category.id = category.parent_id
where incident.category_id = category.id
  and coalesce(parent_category.code, category.code) in ('safeguarding', 'missing_person_child');

revoke all on function public.classify_incident_confidentiality() from public, anon, authenticated;
grant execute on function public.classify_incident_confidentiality() to service_role;

commit;
