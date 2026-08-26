import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperation } from "@/lib/domain/operation-service";
import { listEventCategories, listEventPriorities, listEvents } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge, OperationPhaseBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { EventBoard } from "@/components/events/event-board";

export default async function EventIncidentsPage({ params }: PageProps<"/operations/[id]/events">) {
  const { id } = await params;

  let event;
  try {
    event = await getOperation(id);
  } catch {
    notFound();
  }

  const [incidents, categories, priorities] = await Promise.all([
    listEvents(id),
    listEventCategories(),
    listEventPriorities(event.organisation_id),
  ]);

  const openCount = incidents.filter((i) => i.status !== "closed" && i.status !== "resolved").length;
  const criticalCount = incidents.filter(
    (i) => (i.priority_code === "P1" || i.priority_code === "P2") && i.status !== "closed" && i.status !== "resolved",
  ).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Link href={`/operations/${id}`} className="hover:underline">
            {event.reference}
          </Link>
          <span>·</span>
          <LifecycleStageBadge stage={event.lifecycle_stage} />
          {event.current_phase ? <OperationPhaseBadge phase={event.current_phase} /> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <PageHeader title={`${event.name} — Event Control`} />
            <p className="mt-1 text-sm text-muted-foreground">
              {openCount} open · {criticalCount} P1/P2
            </p>
          </div>
          <Button
            render={<Link href={`/events/new?operation=${id}`} />}
            nativeButton={false}
            size="lg"
            className="bg-destructive text-base text-destructive-foreground hover:bg-destructive/90"
          >
            New Event
          </Button>
        </div>
      </div>

      {incidents.length === 0 ? (
        <EmptyState message="No active events — operation is quiet" />
      ) : (
        <EventBoard incidents={incidents} categories={categories} priorities={priorities} />
      )}
    </div>
  );
}
