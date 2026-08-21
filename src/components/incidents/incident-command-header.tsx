"use client";

import Link from "next/link";
import { IncidentStatusBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { ResponseClocks } from "@/components/incidents/response-clocks";
import type { getIncident, listIncidentPriorities } from "@/lib/domain/incident-service";

type Incident = Awaited<ReturnType<typeof getIncident>>;
type Priority = Awaited<ReturnType<typeof listIncidentPriorities>>[number];

function personName(p: { first_name: string | null; surname: string | null; email: string } | null | undefined) {
  if (!p) return "Unassigned";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export function IncidentCommandHeader({
  incident,
  categoryName,
  priority,
}: {
  incident: Incident;
  categoryName: string;
  priority: Priority | undefined;
}) {
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
        <ResponseClocks
          createdAt={incident.created_at}
          acknowledgedAt={incident.acknowledged_at}
          resolvedAt={incident.resolved_at}
          closedAt={incident.closed_at}
          targetAckMinutes={priority?.target_ack_minutes ?? null}
          targetResolveMinutes={priority?.target_resolve_minutes ?? null}
        />
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
