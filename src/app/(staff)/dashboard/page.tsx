import Link from "next/link";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listEvents } from "@/lib/domain/event-service";
import { listIncidents } from "@/lib/domain/incident-service";
import { EventPhaseBadge } from "@/components/status-badges";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const events = await listEvents();

  const liveEvents = events.filter((e) => e.lifecycle_stage === "live");
  const upcomingEvents = events
    .filter((e) => e.lifecycle_stage !== "live" && e.lifecycle_stage !== "closed" && e.lifecycle_stage !== "archived")
    .filter((e) => e.start_date && new Date(e.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
    .slice(0, 5);

  const liveIncidentCounts = await Promise.all(
    liveEvents.map(async (event) => {
      const incidents = await listIncidents(event.id);
      return {
        eventId: event.id,
        open: incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length,
        urgent: incidents.filter(
          (i) => i.status !== "resolved" && i.status !== "closed" && (i.priority_code === "P1" || i.priority_code === "P2"),
        ).length,
      };
    }),
  );
  const countsByEvent = new Map(liveIncidentCounts.map((c) => [c.eventId, c]));
  const totalOpen = liveIncidentCounts.reduce((sum, c) => sum + c.open, 0);
  const totalUrgent = liveIncidentCounts.reduce((sum, c) => sum + c.urgent, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
      <div>
        <h1 className="text-[28px] leading-none font-bold text-foreground">
          Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
        </h1>
      </div>

      {liveEvents.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="section-label">Live now ({liveEvents.length})</h2>
            {totalOpen > 0 ? (
              <span className={totalUrgent > 0 ? "text-sm font-semibold text-destructive" : "text-sm text-muted-foreground"}>
                {totalOpen} open incident{totalOpen === 1 ? "" : "s"}
                {totalUrgent > 0 ? ` · ${totalUrgent} P1/P2` : ""}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {liveEvents.map((event) => {
              const counts = countsByEvent.get(event.id);
              const urgent = (counts?.urgent ?? 0) > 0;
              return (
                <div
                  key={event.id}
                  className={`space-y-3 rounded-lg border bg-card p-4 ${urgent ? "border-destructive" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.clients?.trading_name || event.clients?.legal_name}
                      </p>
                    </div>
                    {event.current_phase ? <EventPhaseBadge phase={event.current_phase} /> : null}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={urgent ? "text-sm font-semibold text-destructive" : "text-sm text-muted-foreground"}>
                      {counts?.open ?? 0} open incident{counts?.open === 1 ? "" : "s"}
                    </span>
                    <Button
                      render={<Link href={`/events/${event.id}/incidents`} />}
                      nativeButton={false}
                      size="sm"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Incident Control
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState message="No events are live right now" />
      )}

      {upcomingEvents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="section-label">Upcoming</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="row-interactive flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground">{event.name}</span>
                  <span className="text-muted-foreground"> · {event.clients?.trading_name || event.clients?.legal_name}</span>
                </div>
                <span className="data-value">{formatDate(event.start_date)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
