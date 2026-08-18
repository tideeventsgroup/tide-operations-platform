import Link from "next/link";
import { EventPhaseBadge, IncidentStatusBadge } from "@/components/status-badges";
import type { getIncident, listIncidents } from "@/lib/domain/incident-service";

type Incident = Awaited<ReturnType<typeof getIncident>>;
type OtherIncident = Awaited<ReturnType<typeof listIncidents>>[number];

export function IncidentContextRail({
  incident,
  otherOpenIncidents,
}: {
  incident: Incident;
  otherOpenIncidents: OtherIncident[];
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="section-label mb-2">Event</div>
        <Link href={`/events/${incident.events?.id}`} className="block font-medium text-foreground hover:underline">
          {incident.events?.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {incident.events?.current_phase ? <EventPhaseBadge phase={incident.events.current_phase} /> : null}
        </div>
        <Link
          href={`/events/${incident.events?.id}/incidents`}
          className="mt-3 block text-xs font-medium text-primary hover:underline"
        >
          ← Back to incident board
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="section-label mb-2">Other open incidents ({otherOpenIncidents.length})</div>
        {otherOpenIncidents.length === 0 ? (
          <p className="text-muted-foreground">None</p>
        ) : (
          <ul className="space-y-2">
            {otherOpenIncidents.map((other) => (
              <li key={other.id}>
                <Link href={`/incidents/${other.id}`} className="block rounded-md px-2 py-1.5 -mx-2 hover:bg-accent/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      INC-{other.reference.split("-INC-").pop()}
                    </span>
                    <IncidentStatusBadge status={other.status} />
                  </div>
                  <p className="mt-0.5 truncate text-foreground">{other.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
