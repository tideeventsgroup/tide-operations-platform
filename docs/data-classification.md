# Data Classification

Every record that isn't trivially public carries a classification. This
governs RLS visibility, what appears on shared surfaces (wallboard, client
portal, exported reports), and what gets redacted before a document leaves
Tide.

A sub-record may be **more** restricted than its parent, never less (e.g.
an `internal`-classified incident can still have a `restricted` welfare
record attached to it). Enforced by application-level validation on write;
RLS on the sensitive child table is the actual security boundary.

## Levels

| Level | Meaning | Typical audience |
|---|---|---|
| `public` | Safe for unrestricted release (marketing, public event info) | Anyone |
| `client` | Available to Tide staff and the client's authorised portal users | Tide staff + that client's org |
| `internal` | Tide operational information not meant for the client | Tide staff only |
| `confidential` | Limited authorised audience even within Tide (commercial terms, some HR-adjacent content) | Named roles/individuals |
| `restricted` | Medical, safeguarding, sensitive security/investigation, or otherwise highly sensitive | Named roles only, logged access |

## What goes where

**Medical.** The operational incident record (`incidents` table) holds only
what Event Control needs to coordinate a response — category, location,
a plain operational summary ("Adult casualty collapsed near Main Stage.
Medical team attending."). Anything beyond that — diagnosis-adjacent
detail, patient-provided information, treatment given — lives in
`welfare_records` (or a dedicated `medical_details` table once the schema
is written), classified `restricted`, visible only to admins, managers, and
control-room roles explicitly granted medical access. Tide Operations does
not do diagnosis, treatment recommendation, or automated triage — it
coordinates; clinical judgement stays with the medical team on scene.

**Safeguarding.** Missing child / found child / vulnerable person /
safeguarding concern records are `restricted` by default, full stop.
Identifying details (name, description, family contact) never appear on
shared dashboards, the wallboard, or in any export without an explicit,
logged redaction/authorisation step.

**Security.** Ejection, suspected offence, police involvement, suspicious
activity/item, seizure, CCTV reference — `confidential` at minimum,
`restricted` where an active investigation or safeguarding overlap exists.
Client-facing reporting redacts these by default; a named export decision
un-redacts specific fields with a recorded reason.

**Commercial.** Draft quotes/proposals/invoices are `internal` until
explicitly published to the client (`client`); accepted/issued commercial
records remain `client`-visible to the counterparty only, `internal` to
everyone else at Tide who isn't on that deal.

**Documents.** Classification is set per document type at issue and can be
tightened per revision. Approved-but-not-issued documents are `internal`
regardless of their eventual classification.

## Enforcement mechanism

- RLS policy on the table (primary boundary).
- For `restricted` medical/safeguarding data specifically: a **separate
  table**, not a classification column on the shared table — so a routine
  `select * from incidents` by a field reporter's RLS-scoped connection
  cannot return restricted content even if a policy bug exists on the
  parent table. Defence in depth, not defence in one place.
- Exclusion from Realtime broadcast for `restricted` rows.
- Redaction workflow (Phase 11) never mutates the source record — it
  produces a separate, versioned redacted view/export with its own record
  of what was hidden, by whom, and why.

## Not legal advice

This scheme helps Tide manage information sensibly. It is not a
substitute for a formal DPIA, ICO guidance, or legal review of retention
and disclosure obligations — see the Compliance Knowledge Register
(Phase 9) for jurisdiction-specific sourcing of anything that resembles a
legal threshold.
