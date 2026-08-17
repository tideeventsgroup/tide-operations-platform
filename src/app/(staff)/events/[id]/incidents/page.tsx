import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/domain/event-service";
import { listIncidentCategories, listIncidentPriorities, listIncidents } from "@/lib/domain/incident-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">{event.reference}</div>
        <PageHeader
          title={`${event.name} — Incidents`}
          actions={
            <Button
              render={<Link href={`/incidents/new?event=${id}`} />}
              nativeButton={false}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              New Incident
            </Button>
          }
        />
      </div>

      {incidents.length === 0 ? (
        <EmptyState message="No active incidents" />
      ) : (
        <IncidentBoard incidents={incidents} categories={categories} priorities={priorities} />
      )}
    </div>
  );
}
