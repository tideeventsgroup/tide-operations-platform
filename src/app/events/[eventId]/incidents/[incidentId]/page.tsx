import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { requireCapability } from "@/modules/identity/internal-auth";
import { EventAccessDeniedError, resolveEventContext, validateEventId, type EventContext } from "@/modules/tenancy/event-context";
import styles from "../../control/control-console.module.css";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string; incidentId: string }> };
type IncidentRecord = { display_reference: string; initial_report: string | null; reported_at: string; severity: string; status: string };
type TimelineRecord = { content: string | null; occurred_at: string; source: string };
type IncidentData = { event: EventContext; incident: IncidentRecord; timeline: TimelineRecord[] };

export default async function IncidentDetailPage({ params }: RouteContext) {
  const { eventId, incidentId } = await params;
  const data = await loadIncidentData(eventId, incidentId);

  if (!data) redirect("/access-denied");
  const { event, incident, timeline } = data;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.product}><strong>Sential</strong><span>Incident Control</span></div>
        <Link href={`/events/${event.eventId}/control`}>Return to Event Control</Link>
      </header>
      <section className={styles.eventbar}>
        <div><p className="eyebrow">{event.displayReference} · {incident.display_reference}</p><h1>Incident record</h1></div>
        <span className={styles.status}>{incident.status}</span>
      </section>
      <div className={styles.zones}>
        <aside className={styles.zone}>
          <p className={styles.zoneLabel}>Incident state</p>
          <div className={styles.liveMetric}><strong>{incident.severity}</strong><span>Current severity</span></div>
          <div className={styles.liveMetric}><strong>1</strong><span>Record version</span></div>
        </aside>
        <section className={styles.zone} aria-labelledby="timeline-title">
          <p className={styles.zoneLabel}>Operational timeline</p>
          <h2 id="timeline-title">{incident.display_reference}</h2>
          <p>Reported {formatEventTime(incident.reported_at, event.timezone)}</p>
          <div className={styles.empty}>{incident.initial_report ?? "No narrative was available when this report was received."}</div>
          <div className={styles.chronologyHeader}><h2>Chronology</h2></div>
          <table className={styles.incidentTable}>
            <thead><tr><th scope="col">Time</th><th scope="col">Source</th><th scope="col">Recorded fact</th></tr></thead>
            <tbody>{timeline.map((entry, index) => <tr key={`${entry.occurred_at}-${entry.source}-${index}`}><td>{formatEventTime(entry.occurred_at, event.timezone)}</td><td>{entry.source}</td><td>{entry.content ?? "No narrative supplied."}</td></tr>)}</tbody>
          </table>
        </section>
        <aside className={`${styles.zone} ${styles.rail}`}>
          <p className={styles.zoneLabel}>Command rail</p>
          <h2>Next operational step</h2>
          <p>Assessment, assignment and escalation are deliberately unavailable until their governed lifecycle rules are implemented.</p>
        </aside>
      </div>
    </main>
  );
}

async function loadIncidentData(eventId: string, incidentId: string): Promise<IncidentData | null> {
  await requireCapability("event.read");
  const client = createServiceSupabaseClient();

  try {
    validateEventId(incidentId);
    const event = await resolveEventContext(client, eventId);
    const { data: incident, error: incidentError } = await client
      .from("incidents")
      .select("display_reference, status, severity, initial_report, reported_at")
      .eq("event_id", event.eventId)
      .eq("id", incidentId)
      .maybeSingle<IncidentRecord>();
    if (incidentError || !incident) return null;

    const { data: timeline, error: timelineError } = await client
      .from("incident_timeline_entries")
      .select("content, occurred_at, source")
      .eq("event_id", event.eventId)
      .eq("incident_id", incidentId)
      .order("sequence_number", { ascending: true })
      .returns<TimelineRecord[]>();
    if (timelineError) return null;

    return { event, incident, timeline: timeline ?? [] };
  } catch (error) {
    if (error instanceof EventAccessDeniedError) return null;
    throw error;
  }
}

function formatEventTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: timezone }).format(new Date(value));
}
