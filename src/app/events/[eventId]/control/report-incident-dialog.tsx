"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./control-console.module.css";

type EntryMode = "quick" | "full";

export function ReportIncidentDialog({ eventId }: { eventId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null);
  const [initialReport, setInitialReport] = useState("");
  const [title, setTitle] = useState("");
  const [reportSource, setReportSource] = useState("operator");
  const [severity, setSeverity] = useState("unknown");
  const [occurredAt, setOccurredAt] = useState(toLocalDateTimeValue());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function openDialog() {
    setEntryMode(null);
    setError(null);
    setOccurredAt(toLocalDateTimeValue());
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (!submitting) dialogRef.current?.close();
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entryMode) return;
    setSubmitting(true);
    setError(null);
    idempotencyKeyRef.current ??= crypto.randomUUID();

    try {
      const response = await fetch(`/api/events/${eventId}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKeyRef.current },
        body: JSON.stringify({
          entryMode,
          initialReport,
          occurredAt: new Date(occurredAt).toISOString(),
          reportSource,
          severity,
          title: entryMode === "full" ? title : undefined,
        }),
      });
      const payload = await response.json() as { error?: string; incidentId?: string };
      if (!response.ok || !payload.incidentId) {
        setError(payload.error ?? "We could not record the incident. Retry this report to keep it safe.");
        return;
      }
      idempotencyKeyRef.current = null;
      router.push(`/events/${eventId}/incidents/${payload.incidentId}`);
      router.refresh();
    } catch {
      setError("Connection lost before we received confirmation. Retry this report to keep it safe.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button className={styles.reportButton} type="button" onClick={openDialog}>Report received</button>
      <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="report-incident-title">
        <div className={styles.dialogContent}>
          <p className="eyebrow">New operational record</p>
          <h2 id="report-incident-title">{entryMode ? `${entryMode === "quick" ? "Quick" : "Full"} report` : "Report received"}</h2>
          {!entryMode ? <EntryModeChoice onChoose={setEntryMode} /> : (
            <form onSubmit={submitReport}>
              <p>{entryMode === "quick" ? "Capture what is known now. You can complete the structured record immediately afterwards." : "Capture the initial factual details, then continue through the full operational record."}</p>
              {entryMode === "full" ? <FullFields
                occurredAt={occurredAt} reportSource={reportSource} severity={severity} title={title}
                onOccurredAtChange={setOccurredAt} onReportSourceChange={setReportSource}
                onSeverityChange={setSeverity} onTitleChange={setTitle} submitting={submitting}
              /> : null}
              <label className="field-label" htmlFor="initial-report">Initial report
                <textarea className={styles.textarea} id="initial-report" value={initialReport} maxLength={4000}
                  onChange={(input) => setInitialReport(input.target.value)} disabled={submitting} />
              </label>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <div className={styles.actions}>
                <button className={styles.cancelButton} type="button" onClick={() => setEntryMode(null)} disabled={submitting}>Back</button>
                <button className={styles.cancelButton} type="button" onClick={closeDialog} disabled={submitting}>Cancel</button>
                <button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Recording…" : "Record incident"}</button>
              </div>
            </form>
          )}
          {!entryMode ? <div className={styles.actions}><button className={styles.cancelButton} type="button" onClick={closeDialog}>Cancel</button></div> : null}
        </div>
      </dialog>
    </>
  );
}

function EntryModeChoice({ onChoose }: { onChoose: (mode: EntryMode) => void }) {
  return <div className={styles.reportChoices}>
    <button type="button" className={styles.reportChoicePrimary} onClick={() => onChoose("quick")}><strong>Quick report</strong><span>Record an initial narrative in seconds, then complete it in the incident workspace.</span></button>
    <button type="button" className={styles.reportChoice} onClick={() => onChoose("full")}><strong>Full report</strong><span>Start with structured initial facts and continue through the full operational record.</span></button>
  </div>;
}

function FullFields({ occurredAt, reportSource, severity, title, onOccurredAtChange, onReportSourceChange, onSeverityChange, onTitleChange, submitting }: {
  occurredAt: string; reportSource: string; severity: string; title: string; submitting: boolean;
  onOccurredAtChange: (value: string) => void; onReportSourceChange: (value: string) => void;
  onSeverityChange: (value: string) => void; onTitleChange: (value: string) => void;
}) {
  return <div className={styles.reportFields}>
    <label className="field-label" htmlFor="incident-title">Short title<input className={styles.textInput} id="incident-title" value={title} maxLength={200} required disabled={submitting} onChange={(input) => onTitleChange(input.target.value)} /></label>
    <label className="field-label" htmlFor="occurred-at">When it occurred<input className={styles.textInput} id="occurred-at" type="datetime-local" value={occurredAt} required disabled={submitting} onChange={(input) => onOccurredAtChange(input.target.value)} /></label>
    <label className="field-label" htmlFor="report-source">Report source<select className={styles.textInput} id="report-source" value={reportSource} disabled={submitting} onChange={(input) => onReportSourceChange(input.target.value)}><option value="operator">Event Control operator</option><option value="field_reporter">Field reporter</option><option value="radio">Radio traffic</option><option value="member_of_public">Member of public</option><option value="emergency_service">Emergency service</option><option value="other">Other</option></select></label>
    <label className="field-label" htmlFor="incident-severity">Initial severity<select className={styles.textInput} id="incident-severity" value={severity} disabled={submitting} onChange={(input) => onSeverityChange(input.target.value)}><option value="unknown">Unknown</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></label>
  </div>;
}

function toLocalDateTimeValue(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
