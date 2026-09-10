/**
 * Single source of truth for incident status and severity vocabulary.
 *
 * Codes here mirror the database constraints exactly:
 *   incidents_status_check          — received, assessing, active, monitoring,
 *                                     resolved, closed, reopened
 *   incident_severity_levels.code   — low, moderate, high, critical (ranked 1-4)
 *
 * Severity additionally carries `unknown`, the value an incident holds between
 * being received and being assessed. Unknown is deliberately not treated as low:
 * an unassessed incident is outstanding work for Event Control.
 *
 * Every screen must render these through the shared badges so a status keeps one
 * colour and one label across the platform.
 */

export type SeverityCode = "unknown" | "low" | "moderate" | "high" | "critical";
export type StatusCode =
  | "received"
  | "assessing"
  | "active"
  | "monitoring"
  | "resolved"
  | "closed"
  | "reopened";

/** Visual tones. Each maps to one light-background/dark-text badge style. */
export type Tone = "grey" | "blue" | "teal" | "green" | "yellow" | "orange" | "red" | "purple";

export type SeverityDefinition = {
  code: SeverityCode;
  label: string;
  /** Ranked 1-4 to match incident_severity_levels.rank; 0 means not yet assessed. */
  rank: number;
  tone: Tone;
  /** Plain-language meaning, used for tooltips and screen-reader description. */
  meaning: string;
};

export type StatusDefinition = {
  code: StatusCode;
  label: string;
  tone: Tone;
  /** Whether the incident is still live operational work. */
  open: boolean;
  meaning: string;
};

export const SEVERITIES: Record<SeverityCode, SeverityDefinition> = {
  critical: {
    code: "critical",
    label: "Critical",
    rank: 4,
    tone: "red",
    meaning: "Life, safety or event continuity at immediate risk.",
  },
  high: {
    code: "high",
    label: "High",
    rank: 3,
    tone: "orange",
    meaning: "Significant operational impact requiring a prompt response.",
  },
  moderate: {
    code: "moderate",
    label: "Moderate",
    rank: 2,
    tone: "yellow",
    meaning: "Contained impact managed within normal event resources.",
  },
  low: {
    code: "low",
    label: "Low",
    rank: 1,
    tone: "blue",
    meaning: "Minor impact recorded for the operational record.",
  },
  unknown: {
    code: "unknown",
    label: "Unassessed",
    rank: 0,
    tone: "purple",
    meaning: "Severity has not been assessed yet. Assessment is outstanding.",
  },
};

export const STATUSES: Record<StatusCode, StatusDefinition> = {
  received: {
    code: "received",
    label: "Received",
    tone: "purple",
    open: true,
    meaning: "Report received and preserved. Assessment has not begun.",
  },
  assessing: {
    code: "assessing",
    label: "Assessing",
    tone: "blue",
    open: true,
    meaning: "Event Control is assessing and classifying the report.",
  },
  active: {
    code: "active",
    label: "Active",
    tone: "teal",
    open: true,
    meaning: "Response is under way with resources committed.",
  },
  monitoring: {
    code: "monitoring",
    label: "Monitoring",
    tone: "yellow",
    open: true,
    meaning: "Response complete but the situation remains under observation.",
  },
  reopened: {
    code: "reopened",
    label: "Reopened",
    tone: "orange",
    open: true,
    meaning: "Previously resolved and returned to live operational management.",
  },
  resolved: {
    code: "resolved",
    label: "Resolved",
    tone: "green",
    open: false,
    meaning: "Operationally resolved and awaiting review and closure.",
  },
  closed: {
    code: "closed",
    label: "Closed",
    tone: "grey",
    open: false,
    meaning: "Closed. The record is retained as event history.",
  },
};

/** Severity codes ordered most to least serious, excluding unassessed. */
export const ASSESSABLE_SEVERITIES: SeverityCode[] = ["critical", "high", "moderate", "low"];

/** Status codes in lifecycle order, for filters and legends. */
export const STATUS_ORDER: StatusCode[] = [
  "received",
  "assessing",
  "active",
  "monitoring",
  "reopened",
  "resolved",
  "closed",
];

/** Resolve a database value into a definition, never throwing on unexpected input. */
export function severityOf(value: string | null | undefined): SeverityDefinition {
  return SEVERITIES[value as SeverityCode] ?? SEVERITIES.unknown;
}

export function statusOf(value: string | null | undefined): StatusDefinition {
  return (
    STATUSES[value as StatusCode] ?? {
      code: "received" as StatusCode,
      label: humanise(value ?? "Unknown"),
      tone: "grey" as Tone,
      open: true,
      meaning: "Status not recognised by this version of the platform.",
    }
  );
}

/** Turn a snake_case database token into readable text. */
export function humanise(value: string): string {
  const spaced = value.replaceAll("_", " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "";
}

export type TriageSortable = { severity: string; status: string; reportedAt: string };

/**
 * Order incidents the way an Event Control operator needs to read them:
 * live incidents before closed ones, most serious first, and the most recent
 * report first where severity matches. Unassessed reports sit directly below
 * critical because deciding how serious they are is itself urgent work.
 */
export function compareByOperationalPriority(a: TriageSortable, b: TriageSortable): number {
  const aOpen = statusOf(a.status).open;
  const bOpen = statusOf(b.status).open;
  if (aOpen !== bOpen) return aOpen ? -1 : 1;

  const aRank = triageRank(a.severity);
  const bRank = triageRank(b.severity);
  if (aRank !== bRank) return bRank - aRank;

  return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
}

/** Unassessed ranks just below critical so it cannot be buried beneath low incidents. */
function triageRank(severity: string): number {
  const definition = severityOf(severity);
  return definition.code === "unknown" ? 3.5 : definition.rank;
}
