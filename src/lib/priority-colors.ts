// Reserved priority ramp — CSS var handles, matching globals.css. Priority
// colour means one thing only: the event's priority. Never reused for
// status, category, or emphasis — see globals.css's comment on these tokens.
const PRIORITY_COLOR: Record<string, string> = {
  P1: "var(--priority-p1)",
  P2: "var(--priority-p2)",
  P3: "var(--priority-p3)",
  P4: "var(--priority-p4)",
};

export function priorityColor(code: string | null | undefined): string {
  if (!code) return "var(--border)";
  return PRIORITY_COLOR[code] ?? "var(--priority-p4)";
}

export function isPriorityCode(value: string | null | undefined): value is "P1" | "P2" | "P3" | "P4" {
  return Boolean(value && value in PRIORITY_COLOR);
}
