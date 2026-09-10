"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { retainIdempotencyKey } from "@/modules/commands/idempotency";
import styles from "../../control/control-console.module.css";

const NEXT_STATUS: Record<string, string[]> = {
  received: ["assessing"],
  assessing: ["active"],
  active: ["monitoring"],
  monitoring: ["resolved"],
  resolved: ["closed"],
  closed: ["reopened"],
  reopened: ["active"],
};

const SEVERITY_OPTIONS = ["low", "moderate", "high", "critical"];

const STATUS_LABEL: Record<string, string> = {
  assessing: "Assessing",
  active: "Active",
  monitoring: "Monitoring",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

type Props = { eventId: string; incidentId: string; currentStatus: string; currentSeverity: string; version: number };

export function IncidentTransitionCommand({ eventId, incidentId, currentStatus, currentSeverity, version }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const availableStatuses = NEXT_STATUS[currentStatus] ?? [];
  const [targetStatus, setTargetStatus] = useState("");
  const [targetSeverity, setTargetSeverity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const router = useRouter();
  const canSubmit = targetStatus !== "" || targetSeverity !== "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) { setError("Choose a new status, a new severity, or both."); return; }
    setSubmitting(true); setError(null);
    const idempotencyKey = retainIdempotencyKey(idempotencyKeyRef.current, () => crypto.randomUUID());
    idempotencyKeyRef.current = idempotencyKey;
    try {
      const response = await fetch(`/api/events/${eventId}/incidents/${incidentId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedVersion: version,
          targetStatus: targetStatus || null,
          targetSeverity: targetSeverity || null,
          reason,
          idempotencyKey,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setError(payload.error ?? "We could not record this transition."); return; }
      idempotencyKeyRef.current = null;
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Connection lost before we received confirmation. Retry this transition to keep it safe.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <button className={styles.secondaryCommandButton} type="button" onClick={() => dialogRef.current?.showModal()}>Transition incident</button>
    <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="incident-transition-title">
      <div className={styles.dialogContent}>
        <p className="eyebrow">Governed lifecycle change</p>
        <h2 id="incident-transition-title">Transition incident</h2>
        <p>Change the lifecycle status, the severity, or both. Every transition is retained as an immutable, timestamped record.</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="target-status">
            New status
            <select id="target-status" className={styles.textInput} value={targetStatus} onChange={(event) => setTargetStatus(event.target.value)} disabled={submitting || availableStatuses.length === 0}>
              <option value="">No status change</option>
              {availableStatuses.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
            </select>
          </label>
          <label className="field-label" htmlFor="target-severity">
            New severity
            <select id="target-severity" className={styles.textInput} value={targetSeverity} onChange={(event) => setTargetSeverity(event.target.value)} disabled={submitting}>
              <option value="">No severity change</option>
              {SEVERITY_OPTIONS.filter((severity) => severity !== currentSeverity).map((severity) => <option key={severity} value={severity}>{SEVERITY_LABEL[severity]}</option>)}
            </select>
          </label>
          <label className="field-label" htmlFor="transition-reason">
            Reason
            <textarea id="transition-reason" className={styles.textarea} value={reason} maxLength={1000} required onChange={(event) => setReason(event.target.value)} disabled={submitting} />
          </label>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.actions}>
            <button className={styles.cancelButton} type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>Cancel</button>
            <button className={styles.submitButton} type="submit" disabled={submitting || !canSubmit}>{submitting ? "Recording…" : "Confirm transition"}</button>
          </div>
        </form>
      </div>
    </dialog>
  </>;
}
