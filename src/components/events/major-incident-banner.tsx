"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTransition } from "react";
import { activateMajorIncidentAction, deactivateMajorIncidentAction } from "@/lib/actions/flagship-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { getActiveMajorIncidentActivation } from "@/lib/domain/event-service";

type Activation = Awaited<ReturnType<typeof getActiveMajorIncidentActivation>>;

function personName(p: { first_name: string | null; surname: string | null; email: string } | null | undefined) {
  if (!p) return "Unknown";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatElapsed(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function useElapsed(since: string) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    function tick() {
      setSeconds(Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);
  return seconds;
}

const DISCLAIMER =
  "SENTINEL does not contact emergency services automatically. Follow the approved event emergency communications procedure and use 999 where required.";

function ElapsedReadout({ since }: { since: string }) {
  const seconds = useElapsed(since);
  return <span className="font-mono text-xs font-medium text-white/70">ELAPSED {formatElapsed(seconds)}</span>;
}

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
      <div className="space-y-1.5 rounded-lg p-3.5" style={{ background: "color-mix(in oklab, var(--priority-p1) 22%, #14181a)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded px-2 py-1 font-mono text-[11px] font-bold tracking-[0.05em] text-white"
            style={{ background: "var(--priority-p1)" }}
          >
            MAJOR INCIDENT DECLARED
          </span>
          <span className="text-[12.5px] text-white/85">
            Declared by {personName(activation.activated_by_profile)} at{" "}
            <span className="font-mono">{new Date(activation.activated_at).toLocaleTimeString("en-GB")}</span>
          </span>
          <div className="flex-1" />
          <ElapsedReadout since={activation.activated_at} />
          <Button size="sm" variant="outline" disabled={pending} className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={deactivate}>
            Deactivate
          </Button>
        </div>
        <p className="text-[11px] text-white/60">{DISCLAIMER}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {!open ? (
        <Button
          size="lg"
          className="text-base font-semibold text-white"
          style={{ background: "var(--priority-p1)" }}
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
              className="text-white"
              style={{ background: "var(--priority-p1)" }}
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
