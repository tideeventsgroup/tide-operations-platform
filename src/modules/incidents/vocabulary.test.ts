import { describe, expect, it } from "vitest";
import {
  ASSESSABLE_SEVERITIES,
  SEVERITIES,
  STATUSES,
  STATUS_ORDER,
  compareByOperationalPriority,
  humanise,
  severityOf,
  statusOf,
  type TriageSortable,
} from "./vocabulary";

const incident = (severity: string, status: string, reportedAt: string): TriageSortable => ({
  severity,
  status,
  reportedAt,
});

describe("vocabulary definitions", () => {
  it("keeps severity ranks aligned with incident_severity_levels", () => {
    expect(SEVERITIES.low.rank).toBe(1);
    expect(SEVERITIES.moderate.rank).toBe(2);
    expect(SEVERITIES.high.rank).toBe(3);
    expect(SEVERITIES.critical.rank).toBe(4);
  });

  it("treats unassessed severity as distinct from low", () => {
    expect(SEVERITIES.unknown.rank).toBe(0);
    expect(SEVERITIES.unknown.label).toBe("Unassessed");
    expect(SEVERITIES.unknown.tone).not.toBe(SEVERITIES.low.tone);
  });

  it("covers every database status exactly once in lifecycle order", () => {
    expect([...STATUS_ORDER].sort()).toEqual(Object.keys(STATUSES).sort());
  });

  it("marks only resolved and closed as not live", () => {
    const settled = STATUS_ORDER.filter((code) => !STATUSES[code].open);
    expect(settled).toEqual(["resolved", "closed"]);
  });

  it("gives every status and severity a unique label", () => {
    const labels = [
      ...STATUS_ORDER.map((code) => STATUSES[code].label),
      ...ASSESSABLE_SEVERITIES.map((code) => SEVERITIES[code].label),
    ];
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("resolving unexpected values", () => {
  it("falls back to unassessed rather than throwing", () => {
    expect(severityOf(null).code).toBe("unknown");
    expect(severityOf("catastrophic").code).toBe("unknown");
  });

  it("keeps an unrecognised status readable and treats it as live", () => {
    const resolved = statusOf("awaiting_review");
    expect(resolved.label).toBe("Awaiting review");
    expect(resolved.open).toBe(true);
  });

  it("humanises snake_case database tokens", () => {
    expect(humanise("status_transition")).toBe("Status transition");
    expect(humanise("")).toBe("");
  });
});

describe("operational priority ordering", () => {
  it("places live incidents above resolved and closed ones", () => {
    const list = [
      incident("critical", "closed", "2026-09-10T18:00:00Z"),
      incident("low", "active", "2026-09-10T09:00:00Z"),
    ].sort(compareByOperationalPriority);
    expect(list[0].status).toBe("active");
  });

  it("orders live incidents by severity ahead of recency", () => {
    const list = [
      incident("low", "active", "2026-09-10T18:00:00Z"),
      incident("critical", "active", "2026-09-10T09:00:00Z"),
      incident("moderate", "active", "2026-09-10T17:00:00Z"),
    ].sort(compareByOperationalPriority);
    expect(list.map((entry) => entry.severity)).toEqual(["critical", "moderate", "low"]);
  });

  it("ranks unassessed reports below critical but above high", () => {
    const list = [
      incident("high", "received", "2026-09-10T18:00:00Z"),
      incident("unknown", "received", "2026-09-10T09:00:00Z"),
      incident("critical", "received", "2026-09-10T08:00:00Z"),
    ].sort(compareByOperationalPriority);
    expect(list.map((entry) => entry.severity)).toEqual(["critical", "unknown", "high"]);
  });

  it("shows the most recent report first when severity matches", () => {
    const list = [
      incident("high", "active", "2026-09-10T09:00:00Z"),
      incident("high", "active", "2026-09-10T18:00:00Z"),
    ].sort(compareByOperationalPriority);
    expect(list[0].reportedAt).toBe("2026-09-10T18:00:00Z");
  });

  it("is a stable total ordering regardless of input order", () => {
    const entries = [
      incident("critical", "active", "2026-09-10T10:00:00Z"),
      incident("unknown", "received", "2026-09-10T11:00:00Z"),
      incident("high", "monitoring", "2026-09-10T12:00:00Z"),
      incident("low", "resolved", "2026-09-10T13:00:00Z"),
      incident("critical", "closed", "2026-09-10T14:00:00Z"),
    ];
    const forward = [...entries].sort(compareByOperationalPriority);
    const backward = [...entries].reverse().sort(compareByOperationalPriority);
    expect(forward).toEqual(backward);
  });
});
