import Link from "next/link";
import { OperationPhaseBadge, EventStatusBadge } from "@/components/status-badges";
import { splitEventReference } from "@/lib/format-reference";
import type { getEvent, listEvents } from "@/lib/domain/event-service";

type Incident = Awaited<ReturnType<typeof getEvent>>;
type OtherIncident = Awaited<ReturnType<typeof listEvents>>[number];

export function EventContextRail({
  incident,
  otherOpenIncidents,
}: {
  incident: Incident;
  otherOpenIncidents: OtherIncident[];
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="section-label mb-2">Operation</div>
        <Link href={`/operations/${incident.operations?.id}`} className="block font-medium text-foreground hover:underline">
          {incident.operations?.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {incident.operations?.current_phase ? <OperationPhaseBadge phase={incident.operations.current_phase} /> : null}
        </div>
        <Link
          href={`/operations/${incident.operations?.id}/events`}
          className="mt-3 block text-xs font-medium text-primary hover:underline"
        >
          ← Back to event board
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="section-label mb-2">Other open events ({otherOpenIncidents.length})</div>
        {otherOpenIncidents.length === 0 ? (
          <p className="text-muted-foreground">None</p>
        ) : (
          <ul className="space-y-2">
            {otherOpenIncidents.map((other) => {
              const { prefix, number } = splitEventReference(other.reference);
              return (
                <li key={other.id}>
                  <Link href={`/events/${other.id}`} className="block rounded-md px-2 py-1.5 -mx-2 hover:bg-accent/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {prefix}-{number}
                      </span>
                      <EventStatusBadge status={other.status} />
                    </div>
                    <p className="mt-0.5 truncate text-foreground">{other.summary}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
