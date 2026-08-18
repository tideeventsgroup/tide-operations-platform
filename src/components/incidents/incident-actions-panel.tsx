"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  cancelIncidentActionAction,
  completeIncidentActionAction,
  createIncidentActionAction,
} from "@/lib/actions/incident-coordination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { listIncidentActions } from "@/lib/domain/incident-service";

type Action = Awaited<ReturnType<typeof listIncidentActions>>[number];

const STATUS_CLASS: Record<string, string> = {
  open: "bg-warning-bg text-warning",
  in_progress: "bg-info-bg text-info",
  complete: "bg-success-bg text-success",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  complete: "Complete",
  cancelled: "Cancelled",
};

function assigneeName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return null;
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export function IncidentActionsPanel({ incidentId, actions }: { incidentId: string; actions: Action[] }) {
  const [description, setDescription] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!description.trim()) return;
    startTransition(async () => {
      const result = await createIncidentActionAction(incidentId, description.trim());
      if (result.error) toast.error(result.error);
      else setDescription("");
    });
  }

  function complete(actionId: string) {
    startTransition(async () => {
      const result = await completeIncidentActionAction(incidentId, actionId);
      if (result.error) toast.error(result.error);
    });
  }

  function cancel(actionId: string) {
    if (!reason.trim()) return;
    startTransition(async () => {
      const result = await cancelIncidentActionAction(incidentId, actionId, reason.trim());
      if (result.error) toast.error(result.error);
      else {
        setCancellingId(null);
        setReason("");
      }
    });
  }

  const openCount = actions.filter((a) => a.status === "open" || a.status === "in_progress").length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">Actions</h2>
        {openCount > 0 ? <span className="text-xs text-muted-foreground">{openCount} outstanding</span> : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Log a follow-up action…"
          className="flex-1"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !description.trim()}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {actions.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No actions logged</div>
        ) : (
          actions.map((action) => (
            <div key={action.id} className="space-y-2 px-4 py-2.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-foreground", action.status === "cancelled" && "line-through text-muted-foreground")}>
                    {action.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {action.reference}
                    {assigneeName(action.assignee) ? ` · ${assigneeName(action.assignee)}` : ""}
                    {action.status === "cancelled" && action.cancellation_reason ? ` · ${action.cancellation_reason}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className={cn("font-medium", STATUS_CLASS[action.status])}>
                    {STATUS_LABEL[action.status]}
                  </Badge>
                  {action.status === "open" || action.status === "in_progress" ? (
                    <>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => complete(action.id)}>
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => setCancellingId(cancellingId === action.id ? null : action.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {cancellingId === action.id ? (
                <div className="flex items-center gap-2 border-t border-border pt-2">
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for cancelling"
                    className="flex-1"
                  />
                  <Button size="sm" variant="destructive" disabled={pending || !reason.trim()} onClick={() => cancel(action.id)}>
                    Confirm
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
