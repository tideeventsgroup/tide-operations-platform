import { describe, expect, it } from "vitest";
import { advanceProbe, isStale, startProbe, type RefreshProbe } from "./refresh-state";

/** Drive n polling cycles where every refresh lands before the next tick. */
function healthyCycles(count: number): RefreshProbe {
  let probe = startProbe("t0");
  for (let cycle = 1; cycle <= count; cycle += 1) {
    // The tick fires against the render still on screen, then the refresh lands
    // and the next tick sees the newer timestamp.
    probe = advanceProbe(probe, `t${cycle - 1}`);
    probe = advanceProbe(probe, `t${cycle}`);
  }
  return probe;
}

describe("refresh staleness", () => {
  it("does not warn on a freshly loaded screen", () => {
    expect(isStale(startProbe("t0"), false)).toBe(false);
  });

  it("never warns while refreshes keep landing", () => {
    for (const cycles of [1, 5, 20, 200]) {
      expect(isStale(healthyCycles(cycles), false)).toBe(false);
    }
  });

  it("tolerates a single slow cycle without warning", () => {
    const probe = advanceProbe(startProbe("t0"), "t0");
    expect(probe.missed).toBe(1);
    expect(isStale(probe, false)).toBe(false);
  });

  it("warns once two consecutive cycles bring nothing new", () => {
    let probe = startProbe("t0");
    probe = advanceProbe(probe, "t0");
    probe = advanceProbe(probe, "t0");
    expect(isStale(probe, false)).toBe(true);
  });

  it("keeps warning while the screen stays frozen", () => {
    let probe = startProbe("t0");
    for (let cycle = 0; cycle < 10; cycle += 1) probe = advanceProbe(probe, "t0");
    expect(probe.missed).toBe(10);
    expect(isStale(probe, false)).toBe(true);
  });

  it("clears the warning as soon as a refresh lands again", () => {
    let probe = startProbe("t0");
    probe = advanceProbe(probe, "t0");
    probe = advanceProbe(probe, "t0");
    expect(isStale(probe, false)).toBe(true);

    probe = advanceProbe(probe, "t1");
    expect(probe.missed).toBe(0);
    expect(isStale(probe, false)).toBe(false);
  });

  it("warns immediately when the browser is offline, however healthy the poll", () => {
    expect(isStale(healthyCycles(5), true)).toBe(true);
    expect(isStale(startProbe("t0"), true)).toBe(true);
  });
});
