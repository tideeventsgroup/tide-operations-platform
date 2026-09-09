import { describe, expect, it } from "vitest";
import { isLocalDemoEnabled, isValidLocalDemoCredentials } from "./local-demo";

describe("isLocalDemoEnabled", () => {
  it("requires the explicit local flag and a local host", () => {
    expect(isLocalDemoEnabled("true", "localhost:3000")).toBe(true);
    expect(isLocalDemoEnabled("true", "127.0.0.1:3000")).toBe(true);
    expect(isLocalDemoEnabled("true", "[::1]:3000")).toBe(true);
  });

  it("denies missing flags and non-local hosts", () => {
    expect(isLocalDemoEnabled(undefined, "localhost:3000")).toBe(false);
    expect(isLocalDemoEnabled("true", "sential.example.com")).toBe(false);
    expect(isLocalDemoEnabled("false", "localhost:3000")).toBe(false);
  });
});

describe("isValidLocalDemoCredentials", () => {
  it("accepts only the documented local test credentials", () => {
    expect(isValidLocalDemoCredentials("kyle.robb", "demo")).toBe(true);
    expect(isValidLocalDemoCredentials("KYLE.ROBB", "demo")).toBe(true);
    expect(isValidLocalDemoCredentials("kyle.robb", "incorrect")).toBe(false);
  });
});
