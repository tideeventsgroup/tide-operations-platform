import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/domain/event-service";
import { listIncidentCategories, listIncidentPriorities, listIncidents } from "@/lib/domain/incident-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge, EventPhaseBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { IncidentBoard } from "@/components/incidents/incident-board";

export default async function EventIncidentsPage({ params }: PageProps<"/events/[id]/incidents">) {
  const { id } = await params;

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [incidents, categories, priorities] = await Promise.all([
    listIncidents(id),
    listIncidentCategories(),
    listIncidentPriorities(event.organisation_id),
  ]);

  const openCount = incidents.filter((i) => i.status !== "closed" && i.status !== "resolved").length;
  const criticalCount = incidents.filter(
    (i) => (i.priority_code === "P1" || i.priority_code === "P2") && i.status !== "closed" && i.status !== "resolved",
  ).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Link href={`/events/${id}`} className="hover:underline">
            {event.reference}
          </Link>
          <span>·</span>
          <LifecycleStageBadge stage={event.lifecycle_stage} />
          {event.current_phase ? <EventPhaseBadge phase={event.current_phase} /> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <PageHeader title={`${event.name} — Incident Control`} />
            <p className="mt-1 text-sm text-muted-foreground">
              {openCount} open · {criticalCount} P1/P2
            </p>
          </div>
          <Button
            render={<Link href={`/incidents/new?event=${id}`} />}
            nativeButton={false}
            size="lg"
            className="bg-destructive text-base text-destructive-foreground hover:bg-destructive/90"
          >
            New Incident
          </Button>
        </div>
      </div>

      {incidents.length === 0 ? (
        <EmptyState message="No active incidents — event is quiet" />
      ) : (
        <IncidentBoard incidents={incidents} categories={categories} priorities={priorities} />
      )}
    </div>
  );
}
