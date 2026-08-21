-- Restricted incident tiers, built on infrastructure that already existed
-- but was never wired up: incidents.classification (0023) and the
-- incident.view_restricted permission (seeded in 0006, granted to
-- directors/safety/control/security/medical roles, never actually used
-- anywhere until now).
--
-- Deliberate safety design, per docs/data-classification.md's own stated
-- principle ("operational incident record holds only what Event Control
-- needs... anything beyond that lives in a separate table"): raising an
-- incident's tier NEVER hides its existence, category, location, status,
-- or priority from anyone holding plain incident.view — an Event Control
-- Manager must never lose situational awareness of something happening at
-- their own event. What gets gated behind incident.view_restricted is
-- purely the deeper narrative recorded here, kept separate from the
-- ordinary `incidents.description` column (which stays visible to any
-- incident.view holder, unchanged from today).
create table incident_restricted_narrative (
  incident_id uuid primary key references incidents (id) on delete cascade,
  body text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz
);

comment on table incident_restricted_narrative is 'One row per incident, gated by incident.view_restricted. Written only via set_incident_restricted_narrative() — see 0073. Never used for content Event Control needs for basic situational awareness; that stays on incidents.description.';
