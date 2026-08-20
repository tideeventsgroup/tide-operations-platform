import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEvent,
  listControlRoles,
  listControlSessions,
  listEventLocations,
  listEventStageHistory,
} from "@/lib/domain/event-service";
import { listAssignableRoles, listEventPortalGrants } from "@/lib/domain/user-admin-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge, EventPhaseBadge, LocationStatusBadge } from "@/components/status-badges";
import { EventLifecycleControls } from "@/components/events/event-lifecycle-controls";
import { AddLocationForm } from "@/components/events/add-location-form";
import { ControlRosterPanel } from "@/components/events/control-roster-panel";
import { PortalAccessPanel } from "@/components/events/portal-access-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [locations, stageHistory, controlRoles, controlSessions, assignableRoles, portalGrants] = await Promise.all([
    listEventLocations(id),
    listEventStageHistory(id),
    listControlRoles(event.organisation_id),
    listControlSessions(id),
    listAssignableRoles(),
    listEventPortalGrants(id),
  ]);
  const externalRoles = assignableRoles.filter((r) => r.is_external);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {event.reference}
          <span>·</span>
          <Link href={`/clients/${event.clients?.id}`} className="hover:underline">
            {event.clients?.trading_name || event.clients?.legal_name}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <PageHeader title={event.name} />
            <LifecycleStageBadge stage={event.lifecycle_stage} />
            {event.current_phase ? <EventPhaseBadge phase={event.current_phase} /> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button render={<Link href={`/events/${event.id}/control-overview`} />} nativeButton={false} size="lg" variant="outline">
              Control Overview
            </Button>
            <Button
              render={<Link href={`/events/${event.id}/incidents`} />}
              nativeButton={false}
              size="lg"
              className="bg-destructive text-base text-destructive-foreground hover:bg-destructive/90"
            >
              Incident Control
            </Button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Link href={`/events/${event.id}/observations`} className="hover:text-foreground hover:underline">
            Observations
          </Link>
          <Link href={`/events/${event.id}/radio-log`} className="hover:text-foreground hover:underline">
            Radio Log
          </Link>
          <Link href={`/events/${event.id}/documents`} className="hover:text-foreground hover:underline">
            Documents
          </Link>
          <Link href={`/events/${event.id}/risk`} className="hover:text-foreground hover:underline">
            Risk &amp; Readiness
          </Link>
          <Link href={`/events/${event.id}/post-event-report`} className="hover:text-foreground hover:underline">
            Post-event Report
          </Link>
        </nav>
      </div>

      <EventLifecycleControls eventId={event.id} stage={event.lifecycle_stage} eventControlManagerName={undefined} />

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start border-b border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roster">Duty Roster{controlSessions.filter((s) => !s.ended_at).length > 0 ? ` (${controlSessions.filter((s) => !s.ended_at).length})` : ""}</TabsTrigger>
          <TabsTrigger value="portal">Portal Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <section className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="section-label mb-2">Dates</div>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Start</dt>
                  <dd className="data-value">{formatDate(event.start_date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">End</dt>
                  <dd className="data-value">{formatDate(event.end_date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Doors</dt>
                  <dd className="data-value">{formatDateTime(event.doors_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Closes</dt>
                  <dd className="data-value">{formatDateTime(event.closes_at)}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="section-label mb-2">Attendance</div>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expected</dt>
                  <dd className="data-value">{event.expected_attendance ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Licensed capacity</dt>
                  <dd className="data-value">{event.licensed_capacity ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Actual peak</dt>
                  <dd className="data-value">{event.actual_peak ?? "—"}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
              <div className="section-label mb-2">Event</div>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="data-value">{event.category ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Local authority</dt>
                  <dd className="data-value">{event.local_authority ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Jurisdiction</dt>
                  <dd className="data-value">{event.jurisdiction}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="section-label">Site locations ({locations.length})</h2>
              {locations.length === 0 ? (
                <EmptyState message="No locations defined yet" />
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {locations.map((loc) => (
                    <div key={loc.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="section-label !text-[10px]">{loc.type}</span>
                        <span className="font-medium text-foreground">{loc.name}</span>
                      </div>
                      <LocationStatusBadge status={loc.status} />
                    </div>
                  ))}
                </div>
              )}
              <AddLocationForm eventId={id} locations={locations} />
            </div>

            <div className="space-y-3">
              <h2 className="section-label">Lifecycle history</h2>
              {stageHistory.length === 0 ? (
                <EmptyState message="No stage changes recorded" />
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {stageHistory.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <span className="text-muted-foreground">{h.from_stage ?? "—"} → </span>
                        <span className="font-medium text-foreground">{h.to_stage}</span>
                        {h.reason ? <span className="text-muted-foreground"> · {h.reason}</span> : null}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="roster" className="pt-4">
          <ControlRosterPanel eventId={id} roles={controlRoles} sessions={controlSessions} />
        </TabsContent>

        <TabsContent value="portal" className="pt-4">
          <PortalAccessPanel
            eventId={id}
            portalEnabled={event.portal_enabled}
            externalRoles={externalRoles}
            grants={portalGrants}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
