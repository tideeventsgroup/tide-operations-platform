// Martyn's Law — the Terrorism (Protection of Premises) Act 2025 — sets two
// duty tiers by "reasonably expected" number of people at a premises:
// Standard Tier from 200, Enhanced Tier from 800. We take the higher of
// expected attendance and licensed capacity as the conservative estimate
// of that number, since either could be the relevant reasonable
// expectation depending on how firm the operation's numbers are yet.
export type ProtectDutyTier = "none" | "standard" | "enhanced";

const STANDARD_THRESHOLD = 200;
const ENHANCED_THRESHOLD = 800;

export function computeProtectDutyTier(operation: {
  expected_attendance: number | null;
  licensed_capacity: number | null;
}): ProtectDutyTier {
  const capacity = Math.max(operation.expected_attendance ?? 0, operation.licensed_capacity ?? 0);
  if (capacity >= ENHANCED_THRESHOLD) return "enhanced";
  if (capacity >= STANDARD_THRESHOLD) return "standard";
  return "none";
}

export const PROTECT_DUTY_TIER_LABEL: Record<ProtectDutyTier, string> = {
  none: "Not in scope",
  standard: "Standard Tier",
  enhanced: "Enhanced Tier",
};

export const PROTECT_DUTY_TIER_DESCRIPTION: Record<ProtectDutyTier, string> = {
  none: "Below 200 expected attendance/capacity — Martyn's Law does not currently apply to this operation.",
  standard: "200+ expected attendance/capacity — basic public-protection procedures are required.",
  enhanced: "800+ expected attendance/capacity — a documented risk assessment and additional measures are required.",
};
