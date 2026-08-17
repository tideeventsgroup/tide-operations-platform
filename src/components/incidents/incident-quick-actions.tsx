"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  acknowledgeIncidentAction,
  assignControllerAction,
  changePriorityAction,
  closeIncidentAction,
  reopenIncidentAction,
  resolveIncidentAction,
} from "@/lib/actions/incidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { getIncident, listIncidentPriorities } from "@/lib/domain/incident-service";

type Incident = Awaited<ReturnType<typeof getIncident>>;
type Priority = Awaited<ReturnType<typeof listIncidentPriorities>>[number];

type ActiveAction = null | "priority" | "resolve" | "close" | "reopen";

export function IncidentQuickActions({ incident, priorities }: { incident: Incident; priorities: Priority[] }) {
  const [active, setActive] = useState<ActiveAction>(null);
  const [text, setText] = useState("");
  const [priorityCode, setPriorityCode] = useState(incident.priority_code ?? priorities[0]?.code ?? "");
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string; success?: boolean }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else {
        toast.success("Updated");
        setActive(null);
        setText("");
      }
    });
  }

  const isOpen = incident.status !== "resolved" && incident.status !== "closed";
  const isResolved = incident.status === "resolved";
  const isClosed = incident.status === "closed";

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {incident.status === "reported" ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => acknowledgeIncidentAction(incident.id))}>
            Acknowledge
          </Button>
        ) : null}

        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => assignControllerAction(incident.id))}>
          Take Control
        </Button>

        <Button size="sm" variant="outline" disabled={!isOpen} onClick={() => setActive(active === "priority" ? null : "priority")}>
          Change Priority
        </Button>

        {isOpen ? (
          <Button size="sm" variant="outline" onClick={() => setActive(active === "resolve" ? null : "resolve")}>
            Resolve
          </Button>
        ) : null}

        {isResolved ? (
          <Button size="sm" onClick={() => setActive(active === "close" ? null : "close")}>
            Close
          </Button>
        ) : null}

        {isClosed ? (
          <Button size="sm" variant="outline" onClick={() => setActive(active === "reopen" ? null : "reopen")}>
            Reopen
          </Button>
        ) : null}
      </div>

      {active === "priority" ? (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <select
            value={priorityCode}
            onChange={(e) => setPriorityCode(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            {priorities.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => changePriorityAction(incident.id, priorityCode))}
          >
            Set
          </Button>
        </div>
      ) : null}

      {active === "resolve" ? (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Resolution summary"
            className="flex-1"
          />
          <Button size="sm" disabled={pending || !text.trim()} onClick={() => run(() => resolveIncidentAction(incident.id, text.trim()))}>
            Confirm resolve
          </Button>
        </div>
      ) : null}

      {active === "close" ? (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Closure summary"
            className="flex-1"
          />
          <Button size="sm" disabled={pending || !text.trim()} onClick={() => run(() => closeIncidentAction(incident.id, text.trim()))}>
            Confirm close
          </Button>
        </div>
      ) : null}

      {active === "reopen" ? (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reason for reopening"
            className="flex-1"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || !text.trim()}
            onClick={() => run(() => reopenIncidentAction(incident.id, text.trim()))}
          >
            Confirm reopen
          </Button>
        </div>
      ) : null}
    </div>
  );
}
