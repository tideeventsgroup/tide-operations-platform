import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ResponseClocks } from "@/components/events/response-clocks";
import { EventStatusElapsedPill } from "@/components/events/event-status-elapsed-pill";
import { priorityColor, isPriorityCode } from "@/lib/priority-colors";
import { splitEventReference } from "@/lib/format-reference";
import type { getEvent, listEventPriorities } from "@/lib/domain/event-service";

type Incident = Awaited<ReturnType<typeof getEvent>>;
type Priority = Awaited<ReturnType<typeof listEventPriorities>>[number];

function personName(p: { first_name: string | null; surname: string | null; email: string } | null | undefined) {
  if (!p) return "Unassigned";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

// Only shown when actually elevated — a "Standard" badge on every ordinary
// incident would just be noise, same reasoning as the priority badge only
// appearing once a priority is set.
function ClassificationBadge({ classification }: { classification: Incident["classification"] }) {
  if (classification === "confidential") {
    return <Badge className="h-6 bg-warning-bg px-2.5 text-[13px] font-bold text-warning">Restricted</Badge>;
  }
  if (classification === "restricted") {
    return <Badge className="h-6 bg-destructive px-2.5 text-[13px] font-bold text-destructive-foreground">Highly Restricted</Badge>;
  }
  return null;
}

export function EventCommandHeader({
  incident,
  categoryName,
  priority,
}: {
  incident: Incident;
  categoryName: string;
  priority: Priority | undefined;
}) {
  const { prefix, number } = splitEventReference(incident.reference);
  const hasPriority = isPriorityCode(incident.priority_code);
  const endedAt = incident.closed_at ?? incident.resolved_at ?? null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <Link href={`/operations/${incident.operations?.id}`} className="text-primary hover:underline">
          {incident.operations?.name}
        </Link>
        <span>/</span>
        <Link href={`/operations/${incident.operations?.id}/events`} className="text-primary hover:underline">
          Events
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          {prefix}-{number}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {hasPriority ? (
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white uppercase"
                style={{ backgroundColor: priorityColor(incident.priority_code) }}
              >
                {incident.priority_code} {priority?.name ?? ""}
              </span>
            ) : null}
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground uppercase">
              {categoryName}
            </span>
            <EventStatusElapsedPill status={incident.status} priorityCode={incident.priority_code} createdAt={incident.created_at} endedAt={endedAt} />
            <ClassificationBadge classification={incident.classification} />
          </div>
          <h1 className="mb-2 text-[22px] leading-tight font-semibold tracking-tight text-foreground">{incident.summary}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
            <span>
              <span className="text-muted-foreground/70">Ref</span> <span className="font-mono font-medium text-foreground">{incident.reference}</span>
            </span>
            <span className="text-border">|</span>
            <span>
              <span className="text-muted-foreground/70">Opened</span>{" "}
              <span className="font-mono text-foreground">{new Date(incident.created_at).toLocaleTimeString("en-GB")}</span>
            </span>
            <span className="text-border">|</span>
            <span>
              <span className="text-muted-foreground/70">Reported by</span> <span className="text-foreground">{personName(incident.reported_by_profile) !== "Unassigned" ? personName(incident.reported_by_profile) : incident.reported_by_name || "Unknown"}</span>
            </span>
            <span className="text-border">|</span>
            <span>
              <span className="text-muted-foreground/70">Owner</span> <span className="text-foreground">{personName(incident.owner)}</span>
            </span>
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
