"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { completeReadinessCheckAction, uncompleteReadinessCheckAction } from "@/lib/actions/risks";
import type { listOperationReadinessChecks, listReadinessChecklist } from "@/lib/domain/risk-service";

type ChecklistItem = Awaited<ReturnType<typeof listReadinessChecklist>>[number];
type Check = Awaited<ReturnType<typeof listOperationReadinessChecks>>[number];

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export function ReadinessChecklistPanel({
  operationId,
  items,
  checks,
}: {
  operationId: string;
  items: ChecklistItem[];
  checks: Check[];
}) {
  const [pending, startTransition] = useTransition();
  const checkByItemId = new Map(checks.map((c) => [c.checklist_item_id, c]));
  const completeCount = items.filter((i) => checkByItemId.get(i.id)?.completed).length;

  function toggle(itemId: string, currentlyComplete: boolean) {
    startTransition(async () => {
      const result = currentlyComplete
        ? await uncompleteReadinessCheckAction(operationId, itemId)
        : await completeReadinessCheckAction(operationId, itemId);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">Readiness checklist</h2>
        <span className="text-xs text-muted-foreground">
          {completeCount} of {items.length} complete
        </span>
      </div>
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
                onChange={() => toggle(item.id, complete)}
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
    </div>
  );
}
