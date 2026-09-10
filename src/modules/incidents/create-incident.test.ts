import { describe, expect, it } from "vitest";
import {
  createIncidentCommand,
  InvalidIncidentCommandError,
  normalizeInitialReport,
  quickReportInputKeys,
} from "./create-incident";

const eventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const idempotencyKey = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("create incident command", () => {
  it("preserves an explicitly unknown initial report as null", () => {
    const command = createIncidentCommand({
      eventId,
      idempotencyKey,
      entryMode: "full",
      initialReport: "   ",
      occurredAt: "2026-09-07T16:00:00.000Z",
    });

    expect(command.initialReport).toBeNull();
  });

  it("rejects unbounded report content", () => {
    expect(() => normalizeInitialReport("x".repeat(4001))).toThrow(InvalidIncidentCommandError);
  });

  it("rejects non-UUID idempotency keys", () => {
    expect(() => createIncidentCommand({
      eventId,
      idempotencyKey: "not-a-key",
    })).toThrow(InvalidIncidentCommandError);
  });

  it("accepts a structured Full report command", () => {
    const command = createIncidentCommand({
      eventId,
      idempotencyKey,
      entryMode: "full",
      title: "Medical assistance requested",
      initialReport: "A member of the public requested assistance near Zone B.",
      reportSource: "radio",
      occurredAt: "2026-09-07T16:00:00.000Z",
      severity: "high",
    });

    expect(command).toMatchObject({
      entryMode: "full",
      reportSource: "radio",
      severity: "high",
      title: "Medical assistance requested",
    });
  });

  it("keeps the quick path to its five operational inputs", () => {
    expect(quickReportInputKeys).toEqual(["categoryId", "locationOrZone", "severity", "initialReport", "immediateAssistanceRequired"]);
  });

  it("requires every quick-report input", () => {
    expect(() => createIncidentCommand({ eventId, idempotencyKey, entryMode: "quick" })).toThrow(InvalidIncidentCommandError);
  });

  it("rejects an unknown severity or report source", () => {
    expect(() => createIncidentCommand({ eventId, idempotencyKey, severity: "urgent" })).toThrow(InvalidIncidentCommandError);
    expect(() => createIncidentCommand({ eventId, idempotencyKey, reportSource: "whatsapp" })).toThrow(InvalidIncidentCommandError);
  });
});
