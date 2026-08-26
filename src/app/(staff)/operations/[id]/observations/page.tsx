import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperation, listOperationLocations } from "@/lib/domain/operation-service";
import { listObservations } from "@/lib/domain/observation-service";
import { listEventCategories } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { LifecycleStageBadge, OperationPhaseBadge } from "@/components/status-badges";
import { ObservationsPanel } from "@/components/observations/observations-panel";

export default async function EventObservationsPage({ params }: PageProps<"/operations/[id]/observations">) {
  const { id } = await params;

  let event;
  try {
    event = await getOperation(id);
  } catch {
    notFound();
  }

  const [observations, locations, categories] = await Promise.all([
    listObservations(id),
    listOperationLocations(id),
    listEventCategories(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Link href={`/operations/${id}`} className="hover:underline">
            {event.reference}
          </Link>
          <span>·</span>
          <LifecycleStageBadge stage={event.lifecycle_stage} />
          {event.current_phase ? <OperationPhaseBadge phase={event.current_phase} /> : null}
        </div>
        <PageHeader title={`${event.name} — Observations`} description="Lower-friction situational noting, promotable to a full event." />
      </div>

      <ObservationsPanel operationId={id} observations={observations} locations={locations} categories={categories} />
    </div>
  );
}
