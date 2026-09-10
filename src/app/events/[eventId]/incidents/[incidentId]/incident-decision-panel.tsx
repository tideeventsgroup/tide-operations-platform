"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { retainIdempotencyKey } from "@/modules/commands/idempotency";
import styles from "./incident-workspace.module.css";

export type IncidentDecision = { id: string; decision: string; rationale: string; decision_maker: string; decided_at: string };
type Props = { decisions: IncidentDecision[]; eventId: string; incidentId: string };

export function IncidentDecisionPanel({ decisions, eventId, incidentId }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null); const keyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const key = retainIdempotencyKey(keyRef.current, () => crypto.randomUUID()); keyRef.current = key; setSubmitting(true); setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/incidents/${incidentId}/operational`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: "record-decision", decision: form.get("decision"), rationale: form.get("rationale"), informationAvailable: form.get("informationAvailable"), decisionMaker: form.get("decisionMaker"), decidedAt: new Date().toISOString(), idempotencyKey: key }) });
      const payload = await response.json() as { error?: string }; if (!response.ok) { setError(payload.error ?? "We could not record this decision."); return; } keyRef.current = null; event.currentTarget.reset(); dialogRef.current?.close(); router.refresh();
    } catch { setError("Connection lost before confirmation. Retry to safely record this decision."); } finally { setSubmitting(false); }
  }
  return <><section className={styles.decisionPanel}><h3>Decision record</h3>{decisions.length ? <div className={styles.decisionList}>{decisions.map((decision) => <article key={decision.id}><strong>{decision.decision}</strong><p>{decision.rationale}</p><small>{decision.decision_maker} · {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(decision.decided_at))}</small></article>)}</div> : <p>No formal decision has been recorded yet. Record a decision when a choice affects public safety, operations or escalation.</p>}<button className={styles.secondaryControl} type="button" onClick={() => dialogRef.current?.showModal()}>Record decision</button></section>
    <dialog className={styles.archiveDialog} ref={dialogRef} aria-labelledby="decision-title"><form onSubmit={submit} className={styles.commandForm}><p className={styles.eyebrow}>Accountable decision</p><h2 id="decision-title">Record decision</h2><label className="field-label">Decision<textarea className="text-input" name="decision" required maxLength={4000} disabled={submitting} /></label><label className="field-label">Decision maker<input className="text-input" name="decisionMaker" required maxLength={160} disabled={submitting} /></label><label className="field-label">Rationale<input className="text-input" name="rationale" required maxLength={2000} disabled={submitting} /></label><label className="field-label">Information available, optional<textarea className="text-input" name="informationAvailable" maxLength={4000} disabled={submitting} /></label>{error ? <p className={styles.saveError} role="alert">{error}</p> : null}<div className={styles.commandActions}><button className={styles.secondaryControl} type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>Cancel</button><button className="primary-button" disabled={submitting}>{submitting ? "Publishing…" : "Publish decision"}</button></div></form></dialog>
  </>;
}
