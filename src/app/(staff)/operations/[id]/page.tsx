import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOperation,
  listControlRoles,
  listControlSessions,
  listOperationCordons,
  listOperationLocations,
  listOperationStageHistory,
} from "@/lib/domain/operation-service";
import { CordonsPanel } from "@/components/operations/cordons-panel";
import { listEvents } from "@/lib/domain/event-service";
import { listDocuments } from "@/lib/domain/document-service";
import { listAssignableRoles, listOperationPortalGrants } from "@/lib/domain/user-admin-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge, OperationPhaseBadge, LocationStatusBadge } from "@/components/status-badges";
import { computeProtectDutyTier, PROTECT_DUTY_TIER_LABEL } from "@/lib/domain/protect-duty";
import { OperationLifecycleControls } from "@/components/operations/operation-lifecycle-controls";
import { AddLocationForm } from "@/components/operations/add-location-form";
import { ControlRosterPanel } from "@/components/operations/control-roster-panel";
import { PortalAccessPanel } from "@/components/operations/portal-access-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PillNav } from "@/components/ui/pill-nav";
import { priorityColor, isPriorityCode } from "@/lib/priority-colors";
import { splitEventReference } from "@/lib/format-reference";

function StatTileMini({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <div className="font-mono text-[27px] leading-none font-semibold text-foreground">{value}</div>
      <div className="mt-1 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function EventDetailPage({ params }: PageProps<"/operations/[id]">) {
  const { id } = await params;

  let event;
  try {
    event = await getOperation(id);
  } catch {
    notFound();
  }

  const [locations, stageHistory, controlRoles, controlSessions, assignableRoles, portalGrants, events, documents, cordons] = await Promise.all([
    listOperationLocations(id),
    listOperationStageHistory(id),
    listControlRoles(event.organisation_id),
    listControlSessions(id),
    listAssignableRoles(),
    listOperationPortalGrants(id),
    listEvents(id),
    listDocuments(id),
    listOperationCordons(id),
  ]);
  const externalRoles = assignableRoles.filter((r) => r.is_external);
  const onDuty = controlSessions.filter((s) => !s.ended_at);
  const openEvents = events.filter((e) => e.status !== "closed" && e.status !== "resolved");
  const recentEvents = events.slice(0, 5);

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
            {event.current_phase ? <OperationPhaseBadge phase={event.current_phase} /> : null}
            {(() => {
              const tier = computeProtectDutyTier(event);
              if (tier === "none") return null;
              return (
                <Link
                  href={`/operations/${event.id}/risk`}
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.05em] text-white uppercase"
                  style={{ background: tier === "enhanced" ? "var(--priority-p2)" : "var(--priority-p3)" }}
                >
                  Protect Duty · {PROTECT_DUTY_TIER_LABEL[tier]}
                </Link>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <Button render={<Link href={`/operations/${event.id}/control-overview`} />} nativeButton={false} size="lg" variant="outline">
              Control Overview
            </Button>
            <Button
              render={<Link href={`/operations/${event.id}/events`} />}
              nativeButton={false}
              size="lg"
              className="bg-destructive text-base text-destructive-foreground hover:bg-destructive/90"
            >
              Event Control
            </Button>
          </div>
        </div>
        <PillNav
          items={[
            { href: `/operations/${event.id}/observations`, label: "Observations" },
            { href: `/operations/${event.id}/radio-log`, label: "Radio Log" },
            { href: `/operations/${event.id}/documents`, label: "Documents" },
            { href: `/operations/${event.id}/risk`, label: "Risk & Readiness" },
            { href: `/operations/${event.id}/post-event-report`, label: "Post-event Report" },
          ]}
        />
      </div>

      <OperationLifecycleControls operationId={event.id} stage={event.lifecycle_stage} eventControlManagerName={undefined} />

      <Tabs defaultValue="overview">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b border-border [&_[data-slot=tabs-trigger]]:flex-none"
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roster">Duty Roster{controlSessions.filter((s) => !s.ended_at).length > 0 ? ` (${controlSessions.filter((s) => !s.ended_at).length})` : ""}</TabsTrigger>
          <TabsTrigger value="portal">Portal Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTileMini value={openEvents.length} label="Open events" />
            <StatTileMini value={onDuty.length} label="Staff on duty" />
            <StatTileMini value={events.length} label="Events total" />
            <StatTileMini value={locations.length} label="Locations" />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[9.5px] font-semibold tracking-[0.11em] text-muted-foreground uppercase">Recent feed activity</span>
                <Link href={`/operations/${event.id}/events`} className="text-xs font-medium text-primary hover:underline">
                  View full feed
                </Link>
              </div>
              {recentEvents.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No events logged yet</p>
              ) : (
                <div className="flex flex-col">
                  {recentEvents.map((e) => {
                    const { prefix, number } = splitEventReference(e.reference);
                    const hasPriority = isPriorityCode(e.priority_code);
                    return (
                      <Link
                        key={e.id}
                        href={`/events/${e.id}`}
                        className="row-interactive flex items-center gap-2.5 border-b border-border/60 py-2.5 text-sm last:border-b-0"
                      >
                        {hasPriority ? (
                          <span
                            className="rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-white"
                            style={{ background: priorityColor(e.priority_code) }}
                          >
                            {e.priority_code}
                          </span>
                        ) : (
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">—</span>
                        )}
                        <span className="font-mono text-[11px] font-medium text-primary">
                          {prefix}-{number}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-foreground">{e.summary}</span>
                        <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground">
                          {new Date(e.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="mb-2.5 font-mono text-[9.5px] font-semibold tracking-[0.11em] text-muted-foreground uppercase">Key roster</div>
                {onDuty.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No one on duty</p>
                ) : (
                  <div className="space-y-2">
                    {onDuty.slice(0, 4).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-[12.5px]">
                        <span className="text-muted-foreground">{s.operation_control_roles?.name}</span>
                        <span className="font-medium text-foreground">
                          {[s.profiles?.first_name, s.profiles?.surname].filter(Boolean).join(" ") || s.profiles?.email}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="mb-2.5 font-mono text-[9.5px] font-semibold tracking-[0.11em] text-muted-foreground uppercase">Documents</div>
                {documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No documents yet</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {documents.slice(0, 4).map((d) => (
                      <Link key={d.id} href={`/documents/${d.id}`} className="truncate text-[12.5px] text-primary hover:underline">
                        {d.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

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
              <AddLocationForm operationId={id} locations={locations} />
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

          <CordonsPanel operationId={id} cordons={cordons} />
        </TabsContent>

        <TabsContent value="roster" className="pt-4">
          <ControlRosterPanel operationId={id} roles={controlRoles} sessions={controlSessions} />
        </TabsContent>

        <TabsContent value="portal" className="pt-4">
          <PortalAccessPanel
            operationId={id}
            portalEnabled={event.portal_enabled}
            externalRoles={externalRoles}
            grants={portalGrants}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
