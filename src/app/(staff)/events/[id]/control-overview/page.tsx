import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, listControlSessions, listEventLocations } from "@/lib/domain/event-service";
import {
  listActiveMajorIncidentsForEvent,
  listIncidentCategories,
  listIncidentPriorities,
  listIncidents,
} from "@/lib/domain/incident-service";
import { IncidentBoard } from "@/components/incidents/incident-board";
import { LocationStatusBoard } from "@/components/events/location-status-board";
import { AutoRefresh } from "@/components/auto-refresh";
import { EventPhaseBadge } from "@/components/status-badges";

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unknown";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export default async function ControlOverviewPage({ params }: PageProps<"/events/[id]/control-overview">) {
  const { id } = await params;

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [incidents, categories, priorities, controlSessions, majorIncidents, locations] = await Promise.all([
    listIncidents(id),
    listIncidentCategories(),
    listIncidentPriorities(event.organisation_id),
    listControlSessions(id),
    listActiveMajorIncidentsForEvent(id),
    listEventLocations(id),
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
            {event.current_phase ? <EventPhaseBadge phase={event.current_phase} /> : null}
          </div>
        </div>
        <Link href={`/events/${id}/incidents`} className="text-sm text-primary hover:underline">
          Full incident board →
        </Link>
      </div>

      {majorIncidents.length > 0 ? (
        <div className="space-y-2 rounded-lg border-2 border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-bold tracking-wide text-destructive uppercase">Major Incident Mode active</p>
          {majorIncidents.map((m) => (
            <Link
              key={m.id}
              href={`/incidents/${m.incidents.id}`}
              className="block text-sm text-foreground hover:underline"
            >
              {m.incidents.reference} — {m.incidents.summary} ({m.reason})
            </Link>
          ))}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Open incidents</div>
          <div className="text-3xl font-bold text-foreground">{openIncidents.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">P1 / P2</div>
          <div className={urgentCount > 0 ? "text-3xl font-bold text-destructive" : "text-3xl font-bold text-foreground"}>
            {urgentCount}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">On duty</div>
          <div className="text-3xl font-bold text-foreground">{onDuty.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Major incidents</div>
          <div
            className={majorIncidents.length > 0 ? "text-3xl font-bold text-destructive" : "text-3xl font-bold text-foreground"}
          >
            {majorIncidents.length}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Locations</h2>
        <LocationStatusBoard eventId={id} locations={locations} openIncidentCountByLocation={openIncidentCountByLocation} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-3">
          <h2 className="section-label">Open incidents</h2>
          <IncidentBoard incidents={openIncidents} categories={categories} priorities={priorities} />
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
                  <span className="text-muted-foreground"> · {s.event_control_roles?.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
