import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperation, listControlSessions, listOperationLocations } from "@/lib/domain/operation-service";
import {
  listActiveMajorIncidentsForOperation,
  listEventCategories,
  listEventPriorities,
  listEvents,
} from "@/lib/domain/event-service";
import { EventBoard } from "@/components/events/event-board";
import { LocationStatusBoard } from "@/components/operations/location-status-board";
import { AutoRefresh } from "@/components/auto-refresh";
import { OperationPhaseBadge } from "@/components/status-badges";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unknown";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export default async function ControlOverviewPage({ params }: PageProps<"/operations/[id]/control-overview">) {
  const { id } = await params;

  let event;
  try {
    event = await getOperation(id);
  } catch {
    notFound();
  }

  const [incidents, categories, priorities, controlSessions, majorIncidents, locations] = await Promise.all([
    listEvents(id),
    listEventCategories(),
    listEventPriorities(event.organisation_id),
    listControlSessions(id),
    listActiveMajorIncidentsForOperation(id),
    listOperationLocations(id),
  ]);

  const openIncidents = incidents.filter((i) => i.status !== "closed" && i.status !== "resolved");
  const urgentCount = openIncidents.filter((i) => i.priority_code === "P1" || i.priority_code === "P2").length;
  const onDuty = controlSessions.filter((s) => !s.ended_at);

  const openIncidentCountByLocation = new Map<string, number>();
  for (const incident of openIncidents) {
    if (!incident.location_id) continue;
    openIncidentCountByLocation.set(incident.location_id, (openIncidentCountByLocation.get(incident.location_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 px-8 py-8">
      <AutoRefresh intervalSeconds={30} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">{event.reference}</div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] leading-none font-bold text-foreground">{event.name} — Control Overview</h1>
            {event.current_phase ? <OperationPhaseBadge phase={event.current_phase} /> : null}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/operations/${id}/wall`} className="text-sm text-primary hover:underline">
            Wall display →
          </Link>
          <Link href={`/operations/${id}/events`} className="text-sm text-primary hover:underline">
            Full event board →
          </Link>
        </div>
      </div>

      {majorIncidents.length > 0 ? (
        <div className="space-y-2 rounded-lg border-2 border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-bold tracking-wide text-destructive uppercase">Major Incident Mode active</p>
          {majorIncidents.map((m) => (
            <Link
              key={m.id}
              href={`/events/${m.events.id}`}
              className="block text-sm text-foreground hover:underline"
            >
              {m.events.reference} — {m.events.summary} ({m.reason})
            </Link>
          ))}
        </div>
      ) : null}

      <StatTileGroup>
        <StatTile label="Open events" value={openIncidents.length} />
        <StatTile label="P1 / P2" value={<span className={urgentCount > 0 ? "text-destructive" : undefined}>{urgentCount}</span>} />
        <StatTile label="On duty" value={onDuty.length} />
        <StatTile
          label="Major incidents"
          value={<span className={majorIncidents.length > 0 ? "text-destructive" : undefined}>{majorIncidents.length}</span>}
        />
      </StatTileGroup>

      <section className="space-y-3">
        <h2 className="section-label">Locations</h2>
        <LocationStatusBoard operationId={id} locations={locations} openIncidentCountByLocation={openIncidentCountByLocation} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-3">
          <h2 className="section-label">Open events</h2>
          <EventBoard incidents={openIncidents} categories={categories} priorities={priorities} />
        </div>

        <div className="space-y-3">
          <h2 className="section-label">On duty ({onDuty.length})</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {onDuty.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No one currently on duty</div>
            ) : (
              onDuty.map((s) => (
                <div key={s.id} className="px-4 py-2.5 text-sm">
                  <span className="font-medium text-foreground">{personName(s.profiles)}</span>
                  <span className="text-muted-foreground"> · {s.operation_control_roles?.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
