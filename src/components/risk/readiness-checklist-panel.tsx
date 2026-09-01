"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { completeReadinessCheckAction, uncompleteReadinessCheckAction } from "@/lib/actions/risks";
import { PROTECT_DUTY_TIER_DESCRIPTION, PROTECT_DUTY_TIER_LABEL, type ProtectDutyTier } from "@/lib/domain/protect-duty";
import type { listOperationReadinessChecks, listReadinessChecklist } from "@/lib/domain/risk-service";

type ChecklistItem = Awaited<ReturnType<typeof listReadinessChecklist>>[number];
type Check = Awaited<ReturnType<typeof listOperationReadinessChecks>>[number];

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function ChecklistGroup({
  items,
  checkByItemId,
  pending,
  onToggle,
}: {
  items: ChecklistItem[];
  checkByItemId: Map<string, Check>;
  pending: boolean;
  onToggle: (itemId: string, currentlyComplete: boolean) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((item) => {
        const check = checkByItemId.get(item.id);
        const complete = check?.completed ?? false;
        return (
          <label key={item.id} className="flex cursor-pointer items-start gap-3 px-4 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={complete}
              disabled={pending}
              onChange={() => onToggle(item.id, complete)}
              className="mt-0.5 size-4"
            />
            <div className="min-w-0 flex-1">
              <p className={complete ? "font-medium text-foreground line-through" : "font-medium text-foreground"}>{item.name}</p>
              {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
              {complete && check ? (
                <p className="text-xs text-muted-foreground">
                  {personName(check.profiles)} · {check.completed_at ? new Date(check.completed_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : ""}
                </p>
              ) : null}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export function ReadinessChecklistPanel({
  operationId,
  items,
  checks,
  protectDutyTier,
}: {
  operationId: string;
  items: ChecklistItem[];
  checks: Check[];
  protectDutyTier: ProtectDutyTier;
}) {
  const [pending, startTransition] = useTransition();
  const checkByItemId = new Map(checks.map((c) => [c.checklist_item_id, c]));

  const general = items.filter((i) => i.category === "general");
  // Standard Tier procedures apply from 200; Enhanced Tier operations still
  // need the Standard items too, plus the Enhanced ones on top.
  const protectDutyStandard = protectDutyTier !== "none" ? items.filter((i) => i.category === "protect_duty_standard") : [];
  const protectDutyEnhanced = protectDutyTier === "enhanced" ? items.filter((i) => i.category === "protect_duty_enhanced") : [];
  const protectDutyItems = [...protectDutyStandard, ...protectDutyEnhanced];

  const completeCount = general.filter((i) => checkByItemId.get(i.id)?.completed).length;

  function toggle(itemId: string, currentlyComplete: boolean) {
    startTransition(async () => {
      const result = currentlyComplete
        ? await uncompleteReadinessCheckAction(operationId, itemId)
        : await completeReadinessCheckAction(operationId, itemId);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="section-label">Readiness checklist</h2>
          <span className="text-xs text-muted-foreground">
            {completeCount} of {general.length} complete
          </span>
        </div>
        <ChecklistGroup items={general} checkByItemId={checkByItemId} pending={pending} onToggle={toggle} />
      </div>

      {protectDutyTier !== "none" ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="section-label">Protect Duty</h2>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.05em] text-white uppercase"
              style={{ background: protectDutyTier === "enhanced" ? "var(--priority-p2)" : "var(--priority-p3)" }}
            >
              {PROTECT_DUTY_TIER_LABEL[protectDutyTier]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{PROTECT_DUTY_TIER_DESCRIPTION[protectDutyTier]}</p>
          <ChecklistGroup items={protectDutyItems} checkByItemId={checkByItemId} pending={pending} onToggle={toggle} />
        </div>
      ) : null}
    </div>
  );
}
