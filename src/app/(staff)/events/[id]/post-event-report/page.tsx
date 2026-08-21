import { notFound } from "next/navigation";
import { getEvent } from "@/lib/domain/event-service";
import { listIncidentCategories, listIncidentPriorities, listIncidents } from "@/lib/domain/incident-service";
import { listDocuments } from "@/lib/domain/document-service";
import { listRisks } from "@/lib/domain/risk-service";
import { listControlSessions } from "@/lib/domain/event-service";
import { getEventIntelligenceSummary } from "@/lib/domain/event-intelligence-summary";
import { PrintButton } from "@/components/print-button";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function countBy<T, K extends string>(items: T[], key: (item: T) => K): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

export default async function PostEventReportPage({ params }: PageProps<"/events/[id]/post-event-report">) {
  const { id } = await params;

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [incidents, categories, priorities, documents, risks, controlSessions, intelligenceSummary] = await Promise.all([
    listIncidents(id),
    listIncidentCategories(),
    listIncidentPriorities(event.organisation_id),
    listDocuments(id),
    listRisks(id),
    listControlSessions(id),
    getEventIntelligenceSummary(id),
  ]);

  const categoryByCode = new Map(categories.map((c) => [c.code, c.name]));
  const priorityByCode = new Map(priorities.map((p) => [p.code, p.name]));

  const incidentsByStatus = countBy(incidents, (i) => i.status);
  const incidentsByPriority = countBy(incidents, (i) => i.priority_code ?? "unset");
  const incidentsByCategory = countBy(incidents, (i) => i.category_code);

  const resolvedIncidents = incidents.filter((i) => i.resolved_at);
  const avgResolveMs =
    resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, i) => sum + (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()), 0) /
        resolvedIncidents.length
      : null;

  const documentsByStatus = countBy(documents, (d) => d.status);
  const risksByStatus = countBy(risks, (r) => r.status);
  const openHighRisks = risks
    .filter((r) => r.status !== "closed" && (r.risk_score ?? r.likelihood * r.impact) >= 10)
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));

  const uniqueControllers = new Set(controlSessions.map((s) => s.profile_id));
  // Only closed sessions count toward total duty time — a report is a
  // fixed snapshot and shouldn't carry a wall-clock-dependent value from
  // a session that's still open.
  const closedSessions = controlSessions.filter((s) => s.ended_at);
  const totalDutyMs = closedSessions.reduce(
    (sum, s) => sum + Math.max(0, new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-8 print:max-w-none print:px-0">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="font-mono text-xs text-muted-foreground">{event.reference}</div>
          <h1 className="text-[28px] leading-none font-bold text-foreground">Post-event Report</h1>
          <p className="text-sm text-muted-foreground">
            {event.name} · {formatDate(event.start_date)} — {formatDate(event.end_date)}
          </p>
        </div>
        <PrintButton />
      </div>

      <section className="space-y-3">
        <h2 className="section-label">Incidents</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Total</div>
            <div className="text-2xl font-bold text-foreground">{incidents.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Open</div>
            <div className="text-2xl font-bold text-foreground">
              {incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Closed</div>
            <div className="text-2xl font-bold text-foreground">{incidentsByStatus.closed ?? 0}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Avg. time to resolve</div>
            <div className="text-2xl font-bold text-foreground">{avgResolveMs !== null ? formatDuration(avgResolveMs) : "—"}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-2">By priority</div>
            <dl className="space-y-1 text-sm">
              {Object.entries(incidentsByPriority).map(([code, count]) => (
                <div key={code} className="flex justify-between">
                  <dt className="text-muted-foreground">{code === "unset" ? "Unset" : priorityByCode.get(code) ?? code}</dt>
                  <dd className="data-value">{count}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-2">By category</div>
            <dl className="space-y-1 text-sm">
              {Object.entries(incidentsByCategory).map(([code, count]) => (
                <div key={code} className="flex justify-between">
                  <dt className="text-muted-foreground">{categoryByCode.get(code) ?? code}</dt>
                  <dd className="data-value">{count}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Documents</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {Object.entries(documentsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <dt className="capitalize text-muted-foreground">{status.replace("_", " ")}</dt>
                <dd className="data-value">{count}</dd>
              </div>
            ))}
            {documents.length === 0 ? <p className="text-muted-foreground">No documents</p> : null}
          </dl>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Risk register</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-2">By status</div>
            <dl className="space-y-1 text-sm">
              {Object.entries(risksByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <dt className="capitalize text-muted-foreground">{status}</dt>
                  <dd className="data-value">{count}</dd>
                </div>
              ))}
              {risks.length === 0 ? <p className="text-muted-foreground">No risks logged</p> : null}
            </dl>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-2">Outstanding high/critical risks</div>
            {openHighRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground">None outstanding</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {openHighRisks.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span className="text-foreground">{r.title}</span>
                    <span className="data-value shrink-0">{r.risk_score ?? r.likelihood * r.impact}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Intelligence</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Observations</div>
            <div className="text-2xl font-bold text-foreground">{intelligenceSummary.observationsTotal}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">People linked</div>
            <div className="text-2xl font-bold text-foreground">{intelligenceSummary.peopleLinked}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Vehicles linked</div>
            <div className="text-2xl font-bold text-foreground">{intelligenceSummary.vehiclesLinked}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Evidence items</div>
            <div className="text-2xl font-bold text-foreground">{intelligenceSummary.evidenceItems}</div>
          </div>
        </div>
        {intelligenceSummary.radioLogTotal > 0 ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Radio log</div>
            <div className="text-2xl font-bold text-foreground">
              {intelligenceSummary.radioLogTotal}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                entries{intelligenceSummary.radioLogSignificant > 0 ? ` · ${intelligenceSummary.radioLogSignificant} significant` : ""}
              </span>
            </div>
          </div>
        ) : null}
        {intelligenceSummary.observationsTotal > 0 || intelligenceSummary.investigationsLinked > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {intelligenceSummary.observationsTotal > 0 ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="section-label mb-2">Observations by status</div>
                <dl className="space-y-1 text-sm">
                  {Object.entries(intelligenceSummary.observationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <dt className="capitalize text-muted-foreground">{status.replace("_", " ")}</dt>
                      <dd className="data-value">{count}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            {intelligenceSummary.investigationsLinked > 0 ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="section-label mb-1">Investigations touching this event</div>
                <div className="text-2xl font-bold text-foreground">{intelligenceSummary.investigationsLinked}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Event Control roster</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Duty sessions</div>
            <div className="text-2xl font-bold text-foreground">{controlSessions.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">People on duty</div>
            <div className="text-2xl font-bold text-foreground">{uniqueControllers.size}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="section-label mb-1">Total duty time</div>
            <div className="text-2xl font-bold text-foreground">{formatDuration(totalDutyMs)}</div>
          </div>
        </div>
        {closedSessions.length < controlSessions.length ? (
          <p className="text-xs text-muted-foreground">
            {controlSessions.length - closedSessions.length} session(s) still signed on — excluded from total duty time.
          </p>
        ) : null}
      </section>
    </div>
  );
}
