import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns an operational service status", async () => {
    const response = GET();

    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "sential",
    });
  });
});
