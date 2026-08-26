"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { activateMajorIncidentAction, deactivateMajorIncidentAction } from "@/lib/actions/flagship-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { getActiveMajorIncidentActivation } from "@/lib/domain/event-service";

type Activation = Awaited<ReturnType<typeof getActiveMajorIncidentActivation>>;

function personName(p: { first_name: string | null; surname: string | null; email: string } | null | undefined) {
  if (!p) return "Unknown";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

const DISCLAIMER =
  "SENTINEL does not contact emergency services automatically. Follow the approved event emergency communications procedure and use 999 where required.";

export function MajorIncidentBanner({ eventId, activation }: { eventId: string; activation: Activation }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function activate() {
    if (!reason.trim()) return;
    startTransition(async () => {
      const result = await activateMajorIncidentAction(eventId, reason.trim());
      if (result.error) toast.error(result.error);
      else {
        setOpen(false);
        setReason("");
      }
    });
  }

  function deactivate() {
    startTransition(async () => {
      const result = await deactivateMajorIncidentAction(eventId);
      if (result.error) toast.error(result.error);
    });
  }

  if (activation) {
    return (
      <div className="space-y-2 rounded-lg border-2 border-destructive bg-destructive/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold tracking-wide text-destructive uppercase">Major Incident Mode active</p>
            <p className="text-sm text-foreground">{activation.reason}</p>
            <p className="text-xs text-muted-foreground">
              Activated by {personName(activation.activated_by_profile)} ·{" "}
              {new Date(activation.activated_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
            </p>
          </div>
          <Button size="sm" variant="outline" disabled={pending} onClick={deactivate}>
            Deactivate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {!open ? (
        <Button
          size="lg"
          className="bg-destructive text-base font-semibold text-destructive-foreground hover:bg-destructive/90"
          onClick={() => setOpen(true)}
        >
          Activate Major Incident Mode
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
          <div className="flex items-center gap-2">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for activation"
              className="flex-1"
              disabled={pending}
            />
            <Button
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={pending || !reason.trim()}
              onClick={activate}
            >
              Confirm activation
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
