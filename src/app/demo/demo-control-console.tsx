"use client";

import { FormEvent, useRef, useState } from "react";
import { SeverityBadge } from "@/components/operations/status-badge";
import { ASSESSABLE_SEVERITIES, severityOf } from "@/modules/incidents/vocabulary";
import styles from "./demo-control-console.module.css";

type DemoIncident = { id: number; reference: string; severity: string; location: string };

export function DemoControlConsole() {
  const [controlOpen, setControlOpen] = useState(false);
  const [incidents, setIncidents] = useState<DemoIncident[]>([]);
  const [lastUpdate, setLastUpdate] = useState("No demo activity yet.");
  const reportDialog = useRef<HTMLDialogElement>(null);
  const perimeterDialog = useRef<HTMLDialogElement>(null);
  const casualtyDialog = useRef<HTMLDialogElement>(null);

  function addIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const incident = { id: incidents.length + 1, reference: `DEMO-INC-${String(incidents.length + 1).padStart(3, "0")}`, severity: String(values.get("severity") ?? "moderate"), location: String(values.get("location") ?? "Unspecified area") };
    setIncidents((current) => [incident, ...current]);
    setLastUpdate(`${incident.reference} recorded locally. No live incident was created.`);
    reportDialog.current?.close();
    event.currentTarget.reset();
  }

  function recordCheck(event: FormEvent<HTMLFormElement>, type: "Perimeter check" | "Casualty coordination") {
    event.preventDefault();
    setLastUpdate(`${type} recorded locally. No live operational record was created.`);
    (type === "Perimeter check" ? perimeterDialog : casualtyDialog).current?.close();
    event.currentTarget.reset();
  }

  function toggleControl() {
    setControlOpen((open) => !open);
    setLastUpdate(`Event Control ${controlOpen ? "closed" : "opened"} in local demo mode only.`);
  }

  return <main className={styles.shell}>
    <header className={styles.demoBanner} role="status">Local demo mode: no user session, Supabase query, or operational record is used.</header>
    <header className={styles.topbar}><div><strong>Sential</strong><span>Event Control</span></div><span>Test workspace</span></header>
    <section className={styles.eventbar} aria-labelledby="demo-event-title"><div><p>DEMO-2026-001 · Europe/London</p><h1 id="demo-event-title">Local Event Control demonstration</h1></div><span>In-memory test data only</span></section>
    <div className={styles.zones}>
      <aside className={styles.zone} aria-label="Demo live situation"><p className={styles.zoneLabel}>Zone A · Live situation</p><Metric value={String(incidents.length)} label="Demo incidents" /><Metric value={controlOpen ? "Open" : "Closed"} label="Event Control period" /><Metric value="Local" label="Record destination" /></aside>
      <section className={styles.zone} aria-labelledby="demo-incidents-title"><div className={styles.zoneHeader}><div><p className={styles.zoneLabel}>Zone B · Operational picture</p><h2 id="demo-incidents-title">Demo incidents</h2></div><span>{incidents.length} recorded</span></div>{incidents.length === 0 ? <div className={styles.empty}>Add a demo incident to test the three-zone layout. It remains only in this browser tab.</div> : <table><thead><tr><th>Reference</th><th>Severity</th><th>Location</th></tr></thead><tbody>{incidents.map((incident) => <tr key={incident.id}><td>{incident.reference}</td><td><SeverityBadge value={incident.severity} /></td><td>{incident.location}</td></tr>)}</tbody></table>}<p className={styles.update} role="status">{lastUpdate}</p></section>
      <aside className={`${styles.zone} ${styles.rail}`} aria-label="Demo command rail"><p className={styles.zoneLabel}>Zone C · Test command rail</p><h2>Try the workflow</h2><p>Each command is simulated locally and deliberately has no connection to a live event.</p><button className={styles.primary} type="button" onClick={() => reportDialog.current?.showModal()}>Report demo incident</button><button className={controlOpen ? styles.close : styles.secondary} type="button" onClick={toggleControl}>{controlOpen ? "Close demo Event Control" : "Open demo Event Control"}</button><button className={styles.secondary} type="button" disabled={!controlOpen} onClick={() => perimeterDialog.current?.showModal()}>Record perimeter check</button><button className={styles.secondary} type="button" disabled={incidents.length === 0} onClick={() => casualtyDialog.current?.showModal()}>Record casualty coordination</button></aside>
    </div>
    <dialog className={styles.dialog} ref={reportDialog} aria-labelledby="demo-report-title"><form onSubmit={addIncident}><h2 id="demo-report-title">Report demo incident</h2><label>Severity<select name="severity" defaultValue="moderate">{ASSESSABLE_SEVERITIES.map((severity) => <option key={severity} value={severity}>{severityOf(severity).label}</option>)}</select></label><label>Location<input name="location" required maxLength={160} placeholder="e.g. North Gate" /></label><DialogActions onCancel={() => reportDialog.current?.close()} confirm="Add local demo incident" /></form></dialog>
    <dialog className={styles.dialog} ref={perimeterDialog} aria-labelledby="demo-perimeter-title"><form onSubmit={(event) => recordCheck(event, "Perimeter check")}><h2 id="demo-perimeter-title">Demo perimeter check</h2><label>Checkpoint<input required maxLength={160} placeholder="e.g. North Gate" /></label><DialogActions onCancel={() => perimeterDialog.current?.close()} confirm="Record locally" /></form></dialog>
    <dialog className={styles.dialog} ref={casualtyDialog} aria-labelledby="demo-casualty-title"><form onSubmit={(event) => recordCheck(event, "Casualty coordination")}><h2 id="demo-casualty-title">Demo casualty coordination</h2><label>Anonymous reference<input required maxLength={40} placeholder="e.g. C-01" /></label><DialogActions onCancel={() => casualtyDialog.current?.close()} confirm="Record locally" /></form></dialog>
  </main>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div className={styles.metric}><strong>{value}</strong><span>{label}</span></div>; }
function DialogActions({ onCancel, confirm }: { onCancel: () => void; confirm: string }) { return <div className={styles.dialogActions}><button type="button" onClick={onCancel}>Cancel</button><button type="submit">{confirm}</button></div>; }
