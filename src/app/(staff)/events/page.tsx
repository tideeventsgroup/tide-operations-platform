import Link from "next/link";
import { listEvents } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { EntityCard } from "@/components/ui/entity-card";

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader
        title="Events"
        description="Event lifecycle, from enquiry to archive."
        actions={
          <Button render={<Link href="/events/new" />} nativeButton={false}>
            New event
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState message="No events yet" />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EntityCard
              key={event.id}
              href={`/events/${event.id}`}
              title={event.name}
              reference={event.reference}
              value={<LifecycleStageBadge stage={event.lifecycle_stage} />}
              subtitle={event.clients?.trading_name || event.clients?.legal_name || undefined}
              subtitleRight={event.start_date ? new Date(event.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
