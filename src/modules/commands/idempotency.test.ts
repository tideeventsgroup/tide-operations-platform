import { describe, expect, it } from "vitest";
import { retainIdempotencyKey } from "./idempotency";

describe("retainIdempotencyKey", () => {
  it("reuses an unfinished command key instead of issuing a duplicate command", () => {
    expect(retainIdempotencyKey("command-1", () => "command-2")).toBe("command-1");
  });

  it("creates a key only for a new command", () => {
    expect(retainIdempotencyKey(null, () => "command-2")).toBe("command-2");
  });
});
