import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/operations/app-header";
import { LiveRefresh } from "@/components/operations/live-refresh";
import { humanise } from "@/modules/incidents/vocabulary";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { requireCapability, hasCapability, type InternalRole } from "@/modules/identity/internal-auth";
import { EventAccessDeniedError, resolveEventContext, validateEventId, type EventContext } from "@/modules/tenancy/event-context";
import { IncidentTransitionCommand } from "./incident-transition-command";
import { IncidentDetailForm } from "./incident-detail-form";
import { IncidentRecordControls } from "./incident-record-controls";
import { SafeguardingClassification } from "./safeguarding-classification";
import { IncidentActionsPanel, type IncidentAction } from "./incident-actions-panel";
import { IncidentDecisionPanel, type IncidentDecision } from "./incident-decision-panel";
import { IncidentTimelineCommand } from "./incident-timeline-command";
import styles from "./incident-workspace.module.css";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId: string; incidentId: string }>;
  searchParams: Promise<{ section?: string }>;
};
type IncidentRecord = {
  display_reference: string;
  title: string | null;
  initial_report: string | null;
  reported_at: string;
  occurred_at: string;
  severity: string;
  status: string;
  confidentiality: "normal" | "restricted" | "safeguarding";
  version: number;
  location_id: string | null;
  zone_id: string | null;
};
type TimelineRecord = { id: string; content: string | null; occurred_at: string; source: string; entry_type: string };
type IncidentData = {
  event: EventContext;
  incident: IncidentRecord;
  timeline: TimelineRecord[];
  locationName: string | null;
  zoneCode: string | null;
  actorRole: InternalRole;
  recordedSections: string[];
  actions: IncidentAction[];
  decisions: IncidentDecision[];
};

const sections = [
  ["overview", "Overview"], ["chronology", "Chronology"], ["reporter", "Reporter & location"],
  ["information", "Initial information"], ["assessment", "Assessment"], ["resources", "Resources"],
  ["agencies", "Agencies"], ["people", "People & medical"], ["safeguarding", "Safeguarding"],
  ["evidence", "Evidence"], ["impact", "Operational impact"], ["escalation", "Escalation"],
  ["closure", "Resolution & closure"], ["review", "Review & export"],
] as const;

export default async function IncidentDetailPage({ params, searchParams }: RouteContext) {
  const { eventId, incidentId } = await params;
  const { section = "overview" } = await searchParams;
  const data = await loadIncidentData(eventId, incidentId);

  if (!data) redirect("/access-denied");
  const { event, incident, timeline, locationName, zoneCode, actorRole, actions, decisions } = data;
  const selectedSection = sections.some(([id]) => id === section) ? section : "overview";
  const canTransition = hasCapability(actorRole, "incident.manage");
  const title = incident.title ?? incident.initial_report?.slice(0, 96) ?? "Untitled incident";
  const location = [zoneCode ? `Zone ${zoneCode}` : null, locationName].filter(Boolean).join(" · ") || "Location not yet recorded";

  return (
    <main className={styles.shell}>
      <AppHeader active="incidents" event={{ id: event.eventId, name: event.name, reference: event.displayReference }} incidentId={incidentId} />

      <section className={styles.contextBar} aria-label="Incident context">
        <div>
          <p className={styles.reference}>{event.displayReference} · {incident.display_reference}</p>
          <h1>{title}</h1>
          <p className={styles.location}>{location}</p>
        </div>
        <div className={styles.contextStates}>
          <StateBadge label="Status" value={incident.status} />
          <StateBadge label="Severity" value={incident.severity} />
          <StateBadge label="Access" value={incident.confidentiality} />
          <span className={styles.lastUpdate}>Last activity {formatEventTime(timeline.at(-1)?.occurred_at ?? incident.reported_at, event.timezone)}</span>
        </div>
      </section>

      <div className={styles.workspace}>
        <aside className={styles.sectionMenu} aria-label="Incident record sections">
          <p className={styles.menuTitle}>Incident record</p>
          <nav>
            {sections.map(([id, label]) => {
              const state = sectionState(id, timeline.length, incident.confidentiality, data.recordedSections);
              return <Link key={id} href={`?section=${id}`} className={selectedSection === id ? styles.sectionCurrent : styles.sectionLink}>
                <span>{label}</span><small>{state}</small>
              </Link>;
            })}
          </nav>
        </aside>

        <section className={styles.content} aria-labelledby="record-section-title">
          {selectedSection === "overview" ? <Overview incident={incident} timezone={event.timezone} location={location} /> : null}
          {selectedSection === "chronology" ? <Chronology eventId={event.eventId} incidentId={incidentId} timeline={timeline} timezone={event.timezone} canManage={canTransition} renderedAt={new Date().toISOString()} /> : null}
          {selectedSection !== "overview" && selectedSection !== "chronology" ? <IncidentSection eventId={event.eventId} incidentId={incidentId} section={selectedSection} confidentiality={incident.confidentiality} /> : null}
        </section>

        <aside className={styles.commandRail} aria-label="Incident commands">
          <p className={styles.menuTitle}>Command rail</p>
          <h2>Manage the live record</h2>
          <p>Lifecycle changes stay governed and every change is retained in the incident chronology.</p>
          {canTransition ? <IncidentTransitionCommand eventId={event.eventId} incidentId={incidentId} currentStatus={incident.status} currentSeverity={incident.severity} version={incident.version} /> : <p className={styles.permissionHint}>You can view this record but cannot change its lifecycle.</p>}
          {canTransition ? <><IncidentActionsPanel actions={actions} eventId={event.eventId} incidentId={incidentId} /><IncidentDecisionPanel decisions={decisions} eventId={event.eventId} incidentId={incidentId} /><IncidentRecordControls eventId={event.eventId} incidentId={incidentId} reference={incident.display_reference} isAdmin={actorRole === "admin"} title={title} initialReport={incident.initial_report ?? ""} /></> : null}
          <dl className={styles.recordMeta}>
            <div><dt>Reported</dt><dd>{formatEventTime(incident.reported_at, event.timezone)}</dd></div>
            <div><dt>Occurred</dt><dd>{formatEventTime(incident.occurred_at, event.timezone)}</dd></div>
            <div><dt>Record version</dt><dd>{incident.version}</dd></div>
          </dl>
        </aside>
      </div>
    </main>
  );
}

function Overview({ incident, timezone, location }: { incident: IncidentRecord; timezone: string; location: string }) {
  return <><p className={styles.eyebrow}>Live operational record</p><h2 id="record-section-title">Incident overview</h2>
    <div className={styles.summaryGrid}><div><span>Current position</span><strong>{incident.status}</strong></div><div><span>Severity</span><strong>{incident.severity}</strong></div><div><span>Location</span><strong>{location}</strong></div></div>
    <section className={styles.narrative}><h3>Initial report</h3><p>{incident.initial_report ?? "No narrative was available when this report was received."}</p><small>Reported {formatEventTime(incident.reported_at, timezone)}. This record is progressively completed; operational history is retained.</small></section>
  </>;
}

function Chronology({ eventId, incidentId, timeline, timezone, canManage, renderedAt }: { eventId: string; incidentId: string; timeline: TimelineRecord[]; timezone: string; canManage: boolean; renderedAt: string }) {
  return <><p className={styles.eyebrow}>Append-only operational history</p><h2 id="record-section-title">Chronology</h2>
    {canManage ? <IncidentTimelineCommand eventId={eventId} incidentId={incidentId} /> : null}
    {timeline.length ? <ol className={styles.timeline}>{timeline.map((entry) => <li key={entry.id}><time dateTime={entry.occurred_at}>{formatEventTime(entry.occurred_at, timezone)}</time><div><strong>{humanise(entry.entry_type)}</strong><p>{entry.content ?? "No narrative supplied."}</p><small>{humanise(entry.source)}</small></div></li>)}</ol> : <p className={styles.emptyState}>No chronology entries have been recorded yet.</p>}
    <LiveRefresh label="chronology" renderedAt={renderedAt} />
  </>;
}

function IncidentSection({ eventId, incidentId, section, confidentiality }: { eventId: string; incidentId: string; section: string; confidentiality: string }) {
  const label = sections.find(([id]) => id === section)?.[1] ?? "Incident section";
  const restricted = section === "safeguarding" && confidentiality === "safeguarding";
  const editable = section === "reporter" || section === "information" || section === "assessment" || section === "impact" || section === "closure" || section === "resources" || section === "agencies" || section === "people" || section === "evidence" || section === "escalation" || section === "review" ? section : null;
  if (section === "safeguarding" && !restricted) return <><p className={styles.eyebrow}>Not required</p><h2 id="record-section-title">Safeguarding</h2><div className={styles.emptyState}><p>This incident is not currently classified as safeguarding.</p><SafeguardingClassification eventId={eventId} incidentId={incidentId} /></div></>;
  return <><p className={styles.eyebrow}>{restricted ? "Restricted section" : "Structured incident report"}</p><h2 id="record-section-title">{label}</h2>{editable ? <IncidentDetailForm eventId={eventId} incidentId={incidentId} section={editable} /> : <div className={styles.emptyState}><p>This structured section is not recorded yet.</p><p>Its dedicated operational form is being added; use Chronology for a timestamped update in the meantime.</p></div>}</>;
}

function StateBadge({ label, value }: { label: string; value: string }) {
  return <span className={styles.stateBadge}><small>{label}</small><strong>{value.replaceAll("_", " ")}</strong></span>;
}

function sectionState(section: string, timelineCount: number, confidentiality: string, recordedSections: string[]) {
  if (section === "overview") return "Live";
  if (section === "chronology") return timelineCount ? "Recorded" : "Outstanding";
  if (section === "safeguarding" && confidentiality !== "safeguarding") return "Not required";
  if (section === "safeguarding") return "Restricted";
  const table = sectionTables[section];
  return table && recordedSections.includes(table) ? "Recorded" : table ? "Ready to complete" : "Not recorded";
}

const sectionTables: Record<string, string> = { reporter: "incident_reporters", information: "incident_initial_details", assessment: "incident_assessments", impact: "incident_operational_impacts", closure: "incident_closures", resources: "incident_resources", agencies: "incident_agencies", people: "incident_people", evidence: "incident_evidence", escalation: "incident_escalations", review: "incident_follow_up_actions" };

async function loadIncidentData(eventId: string, incidentId: string): Promise<IncidentData | null> {
  const session = await requireCapability("event.read");
  const client = createServiceSupabaseClient();
  try {
    validateEventId(incidentId);
    const event = await resolveEventContext(client, eventId);
    const { data: incident, error } = await client.from("incidents").select("display_reference, title, status, severity, confidentiality, initial_report, reported_at, occurred_at, version, location_id, zone_id").eq("event_id", event.eventId).eq("id", incidentId).maybeSingle<IncidentRecord>();
    if (error || !incident) return null;
    const [{ data: timeline, error: timelineError }, { data: location }, { data: zone }, { data: actions }, { data: decisions }, ...sectionRows] = await Promise.all([
      client.from("incident_timeline_entries").select("id, content, occurred_at, source, entry_type").eq("event_id", event.eventId).eq("incident_id", incidentId).order("sequence_number", { ascending: true }).returns<TimelineRecord[]>(),
      incident.location_id ? client.from("event_locations").select("name").eq("id", incident.location_id).maybeSingle<{ name: string }>() : Promise.resolve({ data: null }),
      incident.zone_id ? client.from("event_zones").select("code").eq("id", incident.zone_id).maybeSingle<{ code: string }>() : Promise.resolve({ data: null }),
      client.from("incident_actions").select("id, title, owner_name, priority, status, due_at, operational_note").eq("event_id", event.eventId).eq("incident_id", incidentId).order("assigned_at", { ascending: false }).returns<IncidentAction[]>(),
      client.from("incident_decisions").select("id, decision, rationale, decision_maker, decided_at").eq("event_id", event.eventId).eq("incident_id", incidentId).order("decided_at", { ascending: false }).returns<IncidentDecision[]>(),
      ...Object.values(sectionTables).map((table) => client.from(table).select("incident_id").eq("incident_id", incidentId).maybeSingle()),
    ]);
    if (timelineError) return null;
    const recordedSections = Object.entries(sectionTables).flatMap(([, table], index) => sectionRows[index]?.data ? [table] : []);
    return { event, incident, timeline: timeline ?? [], locationName: location?.name ?? null, zoneCode: zone?.code ?? null, actorRole: session.role, recordedSections, actions: actions ?? [], decisions: decisions ?? [] };
  } catch (error) { if (error instanceof EventAccessDeniedError) return null; throw error; }
}

function formatEventTime(value: string, timezone: string): string { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(value)); }
