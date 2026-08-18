"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { recordIncidentDecisionAction } from "@/lib/actions/incident-coordination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { listIncidentDecisions } from "@/lib/domain/incident-service";

type Decision = Awaited<ReturnType<typeof listIncidentDecisions>>[number];

function decidedByName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function IncidentDecisionsPanel({ incidentId, decisions }: { incidentId: string; decisions: Decision[] }) {
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!decision.trim()) return;
    startTransition(async () => {
      const result = await recordIncidentDecisionAction(incidentId, decision.trim(), rationale.trim() || undefined);
      if (result.error) toast.error(result.error);
      else {
        setDecision("");
        setRationale("");
      }
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="section-label">Decision log</h2>
      <p className="text-xs text-muted-foreground">
        A permanent record of controller judgement calls. Entries cannot be edited — a wrong decision is superseded by a new
        one.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-2 rounded-lg border border-border bg-card p-3"
      >
        <Input value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Decision made" disabled={pending} />
        <Input
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Rationale (optional)"
          disabled={pending}
        />
        <Button type="submit" size="sm" disabled={pending || !decision.trim()}>
          {pending ? "Recording…" : "Record decision"}
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {decisions.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No decisions recorded</div>
        ) : (
          decisions.map((d) => (
            <div key={d.id} className="space-y-1 px-4 py-2.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium text-foreground">{d.decision}</p>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatTime(d.decided_at)}</span>
              </div>
              {d.rationale ? <p className="text-sm text-muted-foreground">{d.rationale}</p> : null}
              <p className="text-xs text-muted-foreground">
                {d.reference} · {decidedByName(d.decided_by_profile)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
