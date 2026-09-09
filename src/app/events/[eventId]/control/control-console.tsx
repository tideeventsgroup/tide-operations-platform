import Link from "next/link";
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
};

type OperationalPeriod = { id: string; status: "open" | "closed"; version: number } | null;

export function ControlConsole({ event, incidents, operationalPeriod }: {
  event: EventContext;
  incidents: IncidentListItem[];
  operationalPeriod: OperationalPeriod;
}) {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.product}><strong>Sential</strong><span>Event Control</span></div>
        <time dateTime={new Date().toISOString()}><Link href={`/events/${event.eventId}/radios`}>Radio register</Link></time>
      </header>
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
          <div className={styles.liveMetric}><strong>{incidents.length}</strong><span>Reported incidents</span></div>
          <div className={styles.liveMetric}><strong>—</strong><span>Outstanding actions</span></div>
          <div className={styles.liveMetric}><strong>{operationalPeriod?.status === "open" ? "Open" : "Closed"}</strong><span>Event Control period</span></div>
        </aside>
        <section className={styles.zone} aria-labelledby="incident-list-title">
          <div className={styles.zoneHeader}>
            <div><p className={styles.zoneLabel}>Zone B · Operational picture</p><h2 id="incident-list-title">Incidents</h2></div>
            <span className={styles.count}>{incidents.length} recorded</span>
          </div>
          {incidents.length === 0 ? (
            <div className={styles.empty}>No incidents are recorded for this event yet. Reports received here become auditable operational records immediately.</div>
          ) : (
            <div className="event-table-wrap">
              <table className={styles.incidentTable}>
                <thead><tr><th scope="col">Reference</th><th scope="col">Status</th><th scope="col">Severity</th><th scope="col">Received</th></tr></thead>
                <tbody>{incidents.map((incident) => <tr key={incident.id}><td><Link href={`/events/${event.eventId}/incidents/${incident.id}`}>{incident.displayReference}</Link></td><td><span className={styles.status}>{incident.status}</span></td><td>{incident.severity}</td><td>{formatEventTime(incident.reportedAt, event.timezone)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
        <aside className={`${styles.zone} ${styles.rail}`} aria-label="Command rail">
          <p className={styles.zoneLabel}>Zone C · Command rail</p>
          <h2>Record the next fact</h2>
          <p>Start with the report received. The system preserves the initial record before assessment, assignment or escalation begins.</p>
          <ReportIncidentDialog eventId={event.eventId} />
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

function formatEventTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(value));
}
