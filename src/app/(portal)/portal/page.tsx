import Link from "next/link";
import { listPortalEvents } from "@/lib/domain/portal-service";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge } from "@/components/status-badges";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function PortalHomePage() {
  const events = await listPortalEvents();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
      <div className="space-y-1">
        <h1 className="text-[28px] leading-none font-bold text-foreground">Your events</h1>
        <p className="text-sm text-muted-foreground">Status, documents, and updates for your events with Tide Events Group.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState message="No events available yet" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/portal/events/${event.id}`}
              className="row-interactive block space-y-2 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{event.reference}</span>
                <LifecycleStageBadge stage={event.lifecycle_stage} />
              </div>
              <p className="font-semibold text-foreground">{event.name}</p>
              <p className="text-sm text-muted-foreground">
                {event.clients?.trading_name || event.clients?.legal_name} · {formatDate(event.start_date)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
