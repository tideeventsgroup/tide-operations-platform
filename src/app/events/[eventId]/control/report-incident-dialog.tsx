"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ASSESSABLE_SEVERITIES, severityOf } from "@/modules/incidents/vocabulary";
import type { IncidentOption, LocationOption } from "./control-console";
import styles from "./control-console.module.css";

/** Rendered from the shared vocabulary so the options can never drift from the database. */
const severityOptions = ASSESSABLE_SEVERITIES.map((code) => <option key={code} value={code}>{severityOf(code).label}</option>);

type EntryMode = "quick" | "full";

export function ReportIncidentDialog({ eventId, incidentCategories, locations }: { eventId: string; incidentCategories: IncidentOption[]; locations: LocationOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("full");
  const [initialReport, setInitialReport] = useState("");
  const [title, setTitle] = useState("");
  const [reportSource, setReportSource] = useState("operator");
  const [severity, setSeverity] = useState("unknown");
  const [categoryId, setCategoryId] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [immediateAssistanceRequired, setImmediateAssistanceRequired] = useState(false);
  const [occurredAt, setOccurredAt] = useState(toLocalDateTimeValue());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function openDialog(mode: EntryMode) {
    setEntryMode(mode);
    setError(null);
    setInitialReport("");
    setTitle("");
    setReportSource("operator");
    setCategoryId("");
    setLocationValue("");
    setSeverity("unknown");
    setImmediateAssistanceRequired(false);
    setOccurredAt(toLocalDateTimeValue());
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (!submitting) dialogRef.current?.close();
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          occurredAt: entryMode === "quick" ? new Date().toISOString() : new Date(occurredAt).toISOString(),
          reportSource: entryMode === "quick" ? "operator" : reportSource,
          severity,
          categoryId: categoryId || undefined,
          locationId: locationValue.startsWith("location:") ? locationValue.slice(9) : undefined,
          zoneId: locationValue.startsWith("zone:") ? locationValue.slice(5) : undefined,
          immediateAssistanceRequired: entryMode === "quick" ? immediateAssistanceRequired : false,
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
      <div className={styles.reportCommands}>
        <button className={styles.reportButton} type="button" onClick={() => openDialog("full")}>Report received</button>
        <button className={styles.quickReportButton} type="button" onClick={() => openDialog("quick")}>Quick report</button>
      </div>
      <dialog className={styles.dialog} ref={dialogRef} aria-labelledby="report-incident-title">
        <div className={styles.dialogContent}>
          <p className="eyebrow">New operational record</p>
          <h2 id="report-incident-title">{entryMode === "quick" ? "Quick report" : "Full report"}</h2>
          <form onSubmit={submitReport}>
              <p>{entryMode === "quick" ? "Capture what is known now. You can complete the structured record immediately afterwards." : "Capture the initial factual details, then continue through the full operational record."}</p>
              {entryMode === "quick" ? <QuickFields
                categoryId={categoryId} locations={locations} incidentCategories={incidentCategories} locationValue={locationValue}
                severity={severity} initialReport={initialReport} immediateAssistanceRequired={immediateAssistanceRequired} submitting={submitting}
                onCategoryChange={setCategoryId} onLocationChange={setLocationValue} onSeverityChange={setSeverity} onReportChange={setInitialReport} onImmediateAssistanceChange={setImmediateAssistanceRequired}
              /> : <><FullFields
                occurredAt={occurredAt} reportSource={reportSource} severity={severity} title={title}
                onOccurredAtChange={setOccurredAt} onReportSourceChange={setReportSource}
                onSeverityChange={setSeverity} onTitleChange={setTitle} submitting={submitting}
              /><label className="field-label" htmlFor="initial-report">Initial report
                <textarea className={styles.textarea} id="initial-report" value={initialReport} maxLength={4000}
                  onChange={(input) => setInitialReport(input.target.value)} disabled={submitting} />
              </label></>}
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <div className={styles.actions}>
                <button className={styles.cancelButton} type="button" onClick={() => { setEntryMode(entryMode === "quick" ? "full" : "quick"); setError(null); }} disabled={submitting}>{entryMode === "quick" ? "Use full report" : "Use quick report"}</button>
                <button className={styles.cancelButton} type="button" onClick={closeDialog} disabled={submitting}>Cancel</button>
                <button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Recording…" : "Record incident"}</button>
              </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

function QuickFields({ categoryId, locations, incidentCategories, locationValue, severity, initialReport, immediateAssistanceRequired, submitting, onCategoryChange, onLocationChange, onSeverityChange, onReportChange, onImmediateAssistanceChange }: {
  categoryId: string; locations: LocationOption[]; incidentCategories: IncidentOption[]; locationValue: string; severity: string; initialReport: string; immediateAssistanceRequired: boolean; submitting: boolean;
  onCategoryChange: (value: string) => void; onLocationChange: (value: string) => void; onSeverityChange: (value: string) => void; onReportChange: (value: string) => void; onImmediateAssistanceChange: (value: boolean) => void;
}) {
  return <div className={styles.reportFields}>
    <label className="field-label" htmlFor="quick-category">Category<select className={styles.textInput} id="quick-category" required value={categoryId} disabled={submitting} onChange={(event) => onCategoryChange(event.target.value)}><option value="">Choose category</option>{incidentCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
    <label className="field-label" htmlFor="quick-location">Location or zone<select className={styles.textInput} id="quick-location" required value={locationValue} disabled={submitting} onChange={(event) => onLocationChange(event.target.value)}><option value="">Choose location</option>{locations.map((location) => <option key={`${location.type}-${location.id}`} value={`${location.type}:${location.id}`}>{location.label}</option>)}</select></label>
    <label className="field-label" htmlFor="quick-severity">Severity<select className={styles.textInput} id="quick-severity" required value={severity} disabled={submitting} onChange={(event) => onSeverityChange(event.target.value)}><option value="unknown">Choose severity</option>{severityOptions}</select></label>
    <label className="field-label" htmlFor="quick-description">What happened?<textarea className={styles.textarea} id="quick-description" required value={initialReport} maxLength={4000} disabled={submitting} onChange={(event) => onReportChange(event.target.value)} /></label>
    <label className={styles.checkLabel} htmlFor="quick-assistance"><input id="quick-assistance" type="checkbox" checked={immediateAssistanceRequired} disabled={submitting} onChange={(event) => onImmediateAssistanceChange(event.target.checked)} />Immediate assistance required</label>
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
    <label className="field-label" htmlFor="incident-severity">Initial severity<select className={styles.textInput} id="incident-severity" value={severity} disabled={submitting} onChange={(input) => onSeverityChange(input.target.value)}><option value="unknown">{severityOf("unknown").label}</option>{severityOptions}</select></label>
  </div>;
}

function toLocalDateTimeValue(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
