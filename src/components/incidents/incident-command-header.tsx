"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IncidentStatusBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import type { getIncident } from "@/lib/domain/incident-service";

type Incident = Awaited<ReturnType<typeof getIncident>>;

function personName(p: { first_name: string | null; surname: string | null; email: string } | null | undefined) {
  if (!p) return "Unassigned";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function useElapsed(since: string) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    function tick() {
      const ms = Date.now() - new Date(since).getTime();
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [since]);
  return elapsed;
}

export function IncidentCommandHeader({ incident, categoryName }: { incident: Incident; categoryName: string }) {
  const elapsed = useElapsed(incident.created_at);
  const incidentNumber = incident.reference.split("-INC-").pop();

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/events/${incident.events?.id}/incidents`} className="text-xs text-muted-foreground hover:underline">
              {incident.events?.reference}
            </Link>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
            <h1 className="text-[28px] leading-none font-bold tracking-tight text-foreground">
              INC-{incidentNumber} · {categoryName.toUpperCase()}
            </h1>
            {incident.priority_code ? (
              <Badge className="h-6 bg-destructive px-2.5 text-[13px] font-bold text-destructive-foreground">
                {incident.priority_code}
              </Badge>
            ) : null}
            <IncidentStatusBadge status={incident.status} />
          </div>
        </div>
        <div className="text-right">
          <div className="section-label">Elapsed</div>
          <div className="data-value font-mono text-2xl">{elapsed}</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground">{incident.summary}</p>

      <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
        <div>
          <dt className="section-label mb-1">Location</dt>
          <dd className="text-foreground">{incident.operational_locations?.name ?? "Not specified"}</dd>
        </div>
        <div>
          <dt className="section-label mb-1">Controller</dt>
          <dd className="text-foreground">{personName(incident.controller)}</dd>
        </div>
        <div>
          <dt className="section-label mb-1">Owner</dt>
          <dd className="text-foreground">{personName(incident.owner)}</dd>
        </div>
      </dl>
    </div>
  );
}
