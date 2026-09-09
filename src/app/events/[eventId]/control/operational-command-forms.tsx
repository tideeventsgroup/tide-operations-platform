"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { retainIdempotencyKey } from "@/modules/commands/idempotency";
import styles from "./control-console.module.css";

type IncidentOption = { id: string; displayReference: string };
type OperationalPeriod = { id: string; status: "open" | "closed"; version: number } | null;

export function OperationalCommandForms({ eventId, incidents, operationalPeriod }: {
  eventId: string;
  incidents: IncidentOption[];
  operationalPeriod: OperationalPeriod;
}) {
  return (
    <div className={styles.commandStack}>
      <OperationalPeriodCommand eventId={eventId} operationalPeriod={operationalPeriod} />
      <PerimeterCheckCommand eventId={eventId} operationalPeriod={operationalPeriod} />
      <CasualtyCommand eventId={eventId} incidents={incidents} />
    </div>
  );
}

function OperationalPeriodCommand({ eventId, operationalPeriod }: { eventId: string; operationalPeriod: OperationalPeriod }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState({ incidents: false, actions: false, log: false, perimeter: false });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const router = useRouter();
  const isOpen = operationalPeriod?.status === "open";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(null);
    const idempotencyKey = retainIdempotencyKey(idempotencyKeyRef.current, () => crypto.randomUUID());
    idempotencyKeyRef.current = idempotencyKey;
    try {
      const response = await fetch(isOpen
        ? `/api/events/${eventId}/operational-period?periodId=${operationalPeriod.id}`
        : `/api/events/${eventId}/operational-period`, {
        method: isOpen ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isOpen ? {
          closureNote: note, expectedVersion: operationalPeriod.version, idempotencyKey,
          incidentsReviewed: checks.incidents, actionsReviewed: checks.actions,
          logReviewed: checks.log, perimeterReviewed: checks.perimeter,
        } : { openingNote: note, idempotencyKey }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setError(payload.error ?? "We could not record this Event Control command."); return; }
      idempotencyKeyRef.current = null;
      dialogRef.current?.close(); router.refresh();
    } catch { setError("Connection lost before we received confirmation. Retry this command to keep it safe."); }
    finally { setSubmitting(false); }
  }

  return <>
    <button className={isOpen ? styles.closePeriodButton : styles.openPeriodButton} type="button" onClick={() => dialogRef.current?.showModal()}>
      {isOpen ? "Close Event Control" : "Open Event Control"}
    </button>
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="operational-period-title">
      <div className={styles.dialogContent}>
        <p className="eyebrow">Event Control period</p>
        <h2 id="operational-period-title">{isOpen ? "Close Event Control" : "Open Event Control"}</h2>
        <p>{isOpen ? "Confirm the core operational records have been reviewed. Closure is retained as an audit event." : "Open one controlled Event Control period for this event. The opening is immediately auditable."}</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="operational-note">{isOpen ? "Closure note" : "Opening note (optional)"}
            <textarea id="operational-note" className={styles.textarea} required={isOpen} value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} disabled={submitting} />
          </label>
          {isOpen ? <fieldset className={styles.closureChecks}><legend>Close only after confirming</legend>
            <Check checked={checks.incidents} label="Incidents have been reviewed" onChange={(checked) => setChecks({ ...checks, incidents: checked })} />
            <Check checked={checks.actions} label="Outstanding actions have been reviewed" onChange={(checked) => setChecks({ ...checks, actions: checked })} />
            <Check checked={checks.log} label="Operational log has been reviewed" onChange={(checked) => setChecks({ ...checks, log: checked })} />
            <Check checked={checks.perimeter} label="Perimeter status has been reviewed" onChange={(checked) => setChecks({ ...checks, perimeter: checked })} />
          </fieldset> : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.actions}><button className={styles.cancelButton} type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>Cancel</button><button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Recording…" : isOpen ? "Confirm close" : "Confirm open"}</button></div>
        </form>
      </div>
    </dialog>
  </>;
}

function PerimeterCheckCommand({ eventId, operationalPeriod }: { eventId: string; operationalPeriod: OperationalPeriod }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [checkpointName, setCheckpointName] = useState("");
  const [status, setStatus] = useState("secure");
  const [observation, setObservation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const router = useRouter();
  const enabled = operationalPeriod?.status === "open";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!operationalPeriod) return;
    setSubmitting(true); setError(null);
    const idempotencyKey = retainIdempotencyKey(idempotencyKeyRef.current, () => crypto.randomUUID());
    idempotencyKeyRef.current = idempotencyKey;
    try {
      const response = await fetch(`/api/events/${eventId}/perimeter-checks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ periodId: operationalPeriod.id, checkpointName, status, observation, idempotencyKey }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setError(payload.error ?? "We could not record this perimeter check."); return; }
      idempotencyKeyRef.current = null;
      dialogRef.current?.close(); router.refresh();
    } catch { setError("Connection lost before we received confirmation. Retry this check to keep it safe."); }
    finally { setSubmitting(false); }
  }

  return <>
    <button className={styles.secondaryCommandButton} type="button" disabled={!enabled} onClick={() => dialogRef.current?.showModal()}>Record perimeter check</button>
    {!enabled ? <p className={styles.commandHint}>Open Event Control before recording a perimeter check.</p> : null}
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="perimeter-check-title"><div className={styles.dialogContent}>
      <p className="eyebrow">Structured field check</p><h2 id="perimeter-check-title">Perimeter check</h2><p>Record the checkpoint, its state and any factual observation. The check cannot be overwritten.</p>
      <form onSubmit={submit}>
        <label className="field-label" htmlFor="checkpoint-name">Checkpoint or area<input id="checkpoint-name" className={styles.textInput} value={checkpointName} maxLength={160} required onChange={(event) => setCheckpointName(event.target.value)} disabled={submitting} /></label>
        <label className="field-label" htmlFor="perimeter-status">Status<select id="perimeter-status" className={styles.textInput} value={status} onChange={(event) => setStatus(event.target.value)} disabled={submitting}><option value="secure">Secure</option><option value="attention_required">Attention required</option><option value="not_checked">Not checked</option></select></label>
        <label className="field-label" htmlFor="perimeter-observation">Observation (optional)<textarea id="perimeter-observation" className={styles.textarea} value={observation} maxLength={2000} onChange={(event) => setObservation(event.target.value)} disabled={submitting} /></label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}<div className={styles.actions}><button className={styles.cancelButton} type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>Cancel</button><button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Recording…" : "Record check"}</button></div>
      </form>
    </div></dialog>
  </>;
}

function CasualtyCommand({ eventId, incidents }: { eventId: string; incidents: IncidentOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [incidentId, setIncidentId] = useState(incidents[0]?.id ?? "");
  const [casualtyReference, setCasualtyReference] = useState("");
  const [conditionState, setConditionState] = useState("unknown");
  const [careProvider, setCareProvider] = useState("");
  const [handoverStatus, setHandoverStatus] = useState("not_required");
  const [recordingReason, setRecordingReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(null);
    const idempotencyKey = retainIdempotencyKey(idempotencyKeyRef.current, () => crypto.randomUUID());
    idempotencyKeyRef.current = idempotencyKey;
    try {
      const response = await fetch(`/api/events/${eventId}/incidents/${incidentId}/casualties`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ casualtyReference, conditionState, careProvider, handoverStatus, recordingReason, idempotencyKey }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setError(payload.error ?? "We could not record the casualty coordination details."); return; }
      idempotencyKeyRef.current = null;
      dialogRef.current?.close(); router.refresh();
    } catch { setError("Connection lost before we received confirmation. Retry this record to keep it safe."); }
    finally { setSubmitting(false); }
  }

  return <>
    <button className={styles.secondaryCommandButton} type="button" disabled={incidents.length === 0} onClick={() => dialogRef.current?.showModal()}>Restricted casualty record</button>
    {incidents.length === 0 ? <p className={styles.commandHint}>Link a casualty record to an incident once a report has been received.</p> : null}
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="casualty-record-title"><div className={styles.dialogContent}>
      <p className="eyebrow">Restricted access · operational coordination only</p><h2 id="casualty-record-title">Casualty record</h2><p>Use an anonymous reference. Do not enter a name, diagnosis, medical history or treatment details.</p>
      <form onSubmit={submit}>
        <label className="field-label" htmlFor="casualty-incident">Linked incident<select id="casualty-incident" className={styles.textInput} value={incidentId} onChange={(event) => setIncidentId(event.target.value)} disabled={submitting}>{incidents.map((incident) => <option key={incident.id} value={incident.id}>{incident.displayReference}</option>)}</select></label>
        <label className="field-label" htmlFor="casualty-reference">Anonymous reference<input id="casualty-reference" className={styles.textInput} value={casualtyReference} required maxLength={40} placeholder="e.g. C-01" onChange={(event) => setCasualtyReference(event.target.value)} disabled={submitting} /></label>
        <label className="field-label" htmlFor="casualty-condition">Operational state<select id="casualty-condition" className={styles.textInput} value={conditionState} onChange={(event) => setConditionState(event.target.value)} disabled={submitting}><option value="unknown">Unknown</option><option value="minor">Minor</option><option value="requires_medical_assessment">Requires medical assessment</option><option value="emergency_services_requested">Emergency services requested</option><option value="transferred">Transferred</option></select></label>
        <label className="field-label" htmlFor="care-provider">Care provider (optional)<input id="care-provider" className={styles.textInput} value={careProvider} maxLength={160} onChange={(event) => setCareProvider(event.target.value)} disabled={submitting} /></label>
        <label className="field-label" htmlFor="handover-status">Handover<select id="handover-status" className={styles.textInput} value={handoverStatus} onChange={(event) => setHandoverStatus(event.target.value)} disabled={submitting}><option value="not_required">Not required</option><option value="awaiting">Awaiting</option><option value="completed">Completed</option></select></label>
        <label className="field-label" htmlFor="recording-reason">Why this operational record is needed<textarea id="recording-reason" className={styles.textarea} value={recordingReason} maxLength={500} required onChange={(event) => setRecordingReason(event.target.value)} disabled={submitting} /></label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}<div className={styles.actions}><button className={styles.cancelButton} type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>Cancel</button><button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Recording…" : "Record restricted details"}</button></div>
      </form>
    </div></dialog>
  </>;
}

function Check({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <label className={styles.checkLabel}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
