/**
 * Staleness tracking for auto-refreshing operational screens.
 *
 * Kept apart from the React component so the rule that decides whether an
 * operator is warned their screen may be out of date is directly testable.
 *
 * Each page render carries the server timestamp it was produced at. On every
 * polling cycle the tracker compares that value with the one it last reconciled
 * against: unchanged means the refresh did not land, changed means it did.
 */

export type RefreshProbe = {
  /** The server timestamp this counter was last reconciled against. */
  seen: string;
  /** Consecutive polling cycles with no new server render. */
  missed: number;
};

/** Cycles without a new server render before the operator is warned. */
export const STALE_AFTER_MISSED_CYCLES = 2;

export function startProbe(renderedAt: string): RefreshProbe {
  return { seen: renderedAt, missed: 0 };
}

/**
 * Advance one polling cycle. A healthy screen alternates between 0 and 1
 * missed cycles, because a refresh requested on one tick lands before the next,
 * so it never reaches the warning threshold.
 */
export function advanceProbe(current: RefreshProbe, renderedAt: string): RefreshProbe {
  return current.seen === renderedAt
    ? { seen: current.seen, missed: current.missed + 1 }
    : { seen: renderedAt, missed: 0 };
}

export function isStale(probe: RefreshProbe, offline: boolean): boolean {
  return offline || probe.missed >= STALE_AFTER_MISSED_CYCLES;
}
