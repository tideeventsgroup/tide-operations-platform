import Link from "next/link";
import { AppHeader } from "@/components/operations/app-header";
import { SeverityBadge, StatusBadge } from "@/components/operations/status-badge";
import { severityOf, statusOf } from "@/modules/incidents/vocabulary";
import type { EventContext } from "@/modules/tenancy/event-context";
import { OperationalCommandForms } from "./operational-command-forms";
import { ReportIncidentDialog } from "./report-incident-dialog";
import styles from "./control-console.module.css";

export type IncidentListItem = {
  displayReference: string;
  id: string;
  reportedAt: string;
  severity: string;
  status: string;
  openActions: number;
};

type OperationalPeriod = { id: string; status: "open" | "closed"; version: number } | null;
export type IncidentOption = { id: string; label: string };
export type LocationOption = IncidentOption & { type: "location" | "zone" };

export function ControlConsole({ event, incidents, operationalPeriod, incidentCategories, locations, outstandingActions, overdueActions }: {
  event: EventContext;
  incidents: IncidentListItem[];
  operationalPeriod: OperationalPeriod;
  incidentCategories: IncidentOption[];
  locations: LocationOption[];
  outstandingActions: number;
  overdueActions: number;
}) {
  const live = incidents.filter((incident) => statusOf(incident.status).open);
  const priority = live.filter((incident) => severityOf(incident.severity).rank >= 3);
  const unassessed = live.filter((incident) => severityOf(incident.severity).code === "unknown");

  return (
    <main className={styles.shell}>
      <AppHeader active="control" event={{ id: event.eventId, name: event.name, reference: event.displayReference }} />
      <section className={styles.eventbar} aria-labelledby="event-title">
        <div>
          <p className="eyebrow">{event.displayReference} · {event.timezone}</p>
          <h1 id="event-title">{event.name}</h1>
        </div>
        <span className={styles.reference}>One event · one operational picture</span>
      </section>
      <div className={styles.zones}>
        <aside className={styles.zone} aria-label="Live situation">
          <p className={styles.zoneLabel}>Zone A · Live situation</p>
          <div className={styles.liveMetric}><strong>{live.length}</strong><span>Live incidents</span></div>
          <div className={`${styles.liveMetric} ${priority.length ? styles.metricAlert : ""}`}>
            <strong>{priority.length}</strong><span>High or critical</span>
          </div>
          <div className={`${styles.liveMetric} ${unassessed.length ? styles.metricAttention : ""}`}>
            <strong>{unassessed.length}</strong><span>Awaiting assessment</span>
          </div>
          <div className={`${styles.liveMetric} ${overdueActions ? styles.metricAlert : ""}`}>
            <strong>{outstandingActions}</strong>
            <span>{overdueActions ? `Outstanding actions · ${overdueActions} overdue` : "Outstanding actions"}</span>
          </div>
          <div className={styles.liveMetric}><strong>{operationalPeriod?.status === "open" ? "Open" : "Closed"}</strong><span>Event Control period</span></div>
          <p className={styles.metricNote}>Totals cover incidents that are not archived. {incidents.length - live.length} resolved or closed.</p>
        </aside>
        <section className={styles.zone} aria-labelledby="incident-list-title">
          <div className={styles.zoneHeader}>
            <div><p className={styles.zoneLabel}>Zone B · Operational picture</p><h2 id="incident-list-title">Incidents</h2></div>
            <span className={styles.count}>{incidents.length} recorded · most serious first</span>
          </div>
          {incidents.length === 0 ? (
            <div className={styles.empty}>No incidents are recorded for this event yet. Reports received here become auditable operational records immediately.</div>
          ) : (
            <div className="event-table-wrap">
              <table className={styles.incidentTable}>
                <caption className={styles.tableCaption}>
                  Live incidents first, ordered by severity then by most recent report. Incidents awaiting
                  assessment rank directly below critical because classifying them is itself urgent.
                </caption>
                <thead><tr><th scope="col">Reference</th><th scope="col">Severity</th><th scope="col">Status</th><th scope="col">Open actions</th><th scope="col">Received</th></tr></thead>
                <tbody>{incidents.map((incident) => {
                  const closed = !statusOf(incident.status).open;
                  return (
                    <tr key={incident.id} className={closed ? styles.closedRow : undefined}>
                      <td><Link href={`/events/${event.eventId}/incidents/${incident.id}`}>{incident.displayReference}</Link></td>
                      <td><SeverityBadge value={incident.severity} /></td>
                      <td><StatusBadge value={incident.status} /></td>
                      <td>{incident.openActions === 0 ? <span className={styles.noneCell}>None</span> : incident.openActions}</td>
                      <td><time dateTime={incident.reportedAt}>{formatEventTime(incident.reportedAt, event.timezone)}</time></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </section>
        <aside className={`${styles.zone} ${styles.rail}`} aria-label="Command rail">
          <p className={styles.zoneLabel}>Zone C · Command rail</p>
          <h2>Record the next fact</h2>
          <p>Start with the report received. The system preserves the initial record before assessment, assignment or escalation begins.</p>
          <ReportIncidentDialog eventId={event.eventId} incidentCategories={incidentCategories} locations={locations} />
          <OperationalCommandForms
            eventId={event.eventId}
            incidents={incidents.map(({ id, displayReference }) => ({ id, displayReference }))}
            operationalPeriod={operationalPeriod}
          />
        </aside>
      </div>
    </main>
  );
}

/**
 * Times display in the event's own timezone. Entries from an earlier day carry
 * the date as well, so a multi-day event can never present an ambiguous time.
 */
function formatEventTime(value: string, timezone: string): string {
  const reported = new Date(value);
  const dayOf = (date: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeZone: timezone }).format(date);
  const sameDay = dayOf(reported) === dayOf(new Date());
  return new Intl.DateTimeFormat("en-GB", {
    ...(sameDay ? {} : { day: "2-digit", month: "short" }),
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(reported);
}
