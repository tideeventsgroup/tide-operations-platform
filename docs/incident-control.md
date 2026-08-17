# Tide Incident Control — Domain Model

The flagship module. This document is the reference for the incident
domain as it's implemented in Phase 3 onward — read it before touching
`src/lib/domain/incident-service.ts` or the incident migrations.

## Design question for every feature here

*What does the Event Controller need to understand or do in the next 30
seconds?* If a screen, field, or click doesn't serve that, it doesn't
belong in the control-room path — it belongs in Planning, Reports, or
Admin instead.

## Core entities

- **incidents** — one row per incident. `event_id`, `event_phase` (inherited
  at creation time from the event's current phase, not recomputed later),
  `category`, `subtype`, `priority`, `status`, `location_id`, `summary`,
  `controller_id`, `owner_id`, `classification`, `report_source`, and the
  clock fields in §"Time integrity" below.
- **incident_log_entries** — append-only timeline. Every incident event
  (report, update, status change, dispatch, arrival, decision link, action
  link, agency, attachment, escalation, system event, correction) is a row
  here, never an edit to a prior row.
- **incident_actions**, **decisions** — first-class records, not timeline
  chatter, but linked back into the timeline via `incident_log_entries`
  rows of type `action` / `decision` that reference them.
- **methane_messages** + **methane_message_versions** — see §M/ETHANE.
- **welfare_records** — restricted, see `docs/data-classification.md`.
- **resources**, **resource_status_history** — dispatch and status.
- **event_control_sessions**, **event_control_roles** — who is on control
  duty and in what role, per event.

## Controller / Owner / Resource — a real distinction

- **Controller**: maintains the Event Control record for this incident
  (may hand over between shifts; recorded via `controller_id` + a
  `controller_assigned` log entry, not a silent field update).
- **Incident Owner**: operationally responsible for the response. Can be
  different from the controller (e.g. Security Manager owns a security
  incident that Event Control is merely logging).
- **Resources**: teams/people actually doing the work, dispatched via
  `dispatch_resource()` (see below), tracked through
  `resource_status_history`.

These are three separate columns/tables, never conflated into one
"assigned to" field.

## Priority

P1 Critical / P2 Serious / P3 Moderate / P4 Routine — operational
priority, explicitly **not** a clinical triage claim. Definitions live in
an organisation-configurable table (`incident_priority_definitions`), not
hardcoded strings, and every definition change is audited.

## Status lifecycle

`Reported → Acknowledged → Active → Monitoring → Resolved → Closed`, with
optional `Awaiting Information`, `External Agency Lead`, `Suspended`.
Reopening a closed incident requires an authorised role + a reason, adds a
`reopened` log entry, and never erases the original closure record.

## Timeline model — append-only, corrections not edits

Ordinary users cannot rewrite `incident_log_entries.body` after creation.
To fix a wrong entry: `Add Correction`, which inserts a new row of type
`correction` referencing the original entry's ID. Both remain visible in
order. This is enforced at the RPC layer (`append_incident_log_entry()`
vs. no `UPDATE` grant on the table for non-privileged roles), not just a
UI convention.

## Time integrity

Every clock-relevant row stores:

- `occurred_at` — when it happened operationally (may be entered late).
- `reported_at` — when it was reported to Event Control.
- `created_at` — system-generated, immutable, when the row was written.

All stored in UTC; rendered in the event's local timezone. When
`created_at` is materially later than `reported_at`/`occurred_at`, the UI
shows both ("Entered 18:21 · Operational time 18:14") rather than picking
one. Incident-level clocks (acknowledged, assigned, dispatched, on-scene,
external-service-requested/arrived, resolved, closed) are computed from
the timeline, not stored redundantly on the incident row, so they can
never drift out of sync with the log that produced them.

## Guarded transitions (Postgres RPCs, not raw UPDATE)

`create_incident`, `acknowledge_incident`, `assign_controller`,
`append_incident_log_entry`, `change_incident_priority`,
`dispatch_resource`, `update_resource_status`, `create_incident_action`,
`record_decision`, `link_incidents`, `merge_incidents`,
`create_methane_message`, `resolve_incident`, `close_incident`,
`reopen_incident`, `add_correction`. Each function does its own
authorisation check (via the RLS helper functions) in addition to RLS on
the underlying tables — belt and braces, because some of these functions
need to write to more than one table atomically (e.g. `close_incident`
writes the status change, a closure-summary log entry, and an audit row in
one transaction) and `SECURITY DEFINER` functions bypass RLS by design, so
they must enforce it themselves.

## M/ETHANE

Structured fields: Major incident declared? / Exact location / Type /
Hazards / Access & egress / Number & type of casualties / Emergency
services present-or-required. Never overwritten — each submission creates
`methane_messages` row `METHANE-00N` via `methane_message_versions`,
linked to the triggering incident. A "copy formatted" function produces a
clean radio/phone-readable block from the latest version.

## Major Incident Mode

Activation is a deliberate, confirmed action by an authorised role,
recorded (`activated_by`, `time`, `incident_id`, `reason`). It re-focuses
the UI toward situation/M-ETHANE/command/decisions/actions/resources/
agencies/comms/map — it does not change what data exists, only what's
foregrounded. The activation screen and every Major Incident Mode surface
carries the fixed disclaimer:

> Tide Operations does not contact emergency services automatically.
> Follow the approved event emergency communications procedure and use 999
> where required.

No control in this product ever simulates dispatching an emergency
service.

## Closure

Before `close_incident` succeeds, the RPC checks: resolved, outstanding
actions none/acknowledged, external agencies recorded if any were
involved, decisions marked complete, classification reviewed. Missing
items block closure with a specific reason rather than a generic
rejection — the controller sees exactly what's outstanding.

## Reporting

Client-facing incident reports are generated from a **redacted view**, not
by mutating the source record — see `docs/data-classification.md`
§"Enforcement mechanism". The full internal chronology (timeline +
decisions + actions + resources + agencies) must always be reconstructable
from the append-only log; if a report can't answer *what happened, when
was it reported, who received it, what was known, what was done, by whom,
what was decided and why, what responded, were agencies involved, when was
it resolved* — that's a modelling bug, not a reporting bug, and the schema
needs to change.
