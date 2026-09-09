import { describe, expect, it } from "vitest";
import { EventAccessDeniedError, validateEventId } from "./event-context";

describe("validateEventId", () => {
  it("accepts UUID event identifiers", () => {
    expect(() => validateEventId("018f9317-f2a0-7b86-a3f0-b43ac8b7a9aa")).not.toThrow();
  });

  it("rejects non-UUID event identifiers", () => {
    expect(() => validateEventId("EVT-2026-0012")).toThrow(EventAccessDeniedError);
  });
});
