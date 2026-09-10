"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { retainIdempotencyKey } from "@/modules/commands/idempotency";
import styles from "./incident-workspace.module.css";

export type IncidentAction = { id: string; title: string; owner_name: string; priority: string; status: string; due_at: string | null; operational_note: string | null };
type Props = { actions: IncidentAction[]; eventId: string; incidentId: string };

export function IncidentActionsPanel({ actions, eventId, incidentId }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null); const keyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const router = useRouter();
  async function command(body: Record<string, unknown>) {
    const response = await fetch(`/api/events/${eventId}/incidents/${incidentId}/operational`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as { error?: string }; if (!response.ok) throw new Error(payload.error ?? "We could not update this action.");
  }
  async function createAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const key = retainIdempotencyKey(keyRef.current, () => crypto.randomUUID()); keyRef.current = key; setSubmitting(true); setError(null);
    const dueAtInput = String(form.get("dueAt") ?? "");
    const dueAt = dueAtInput ? new Date(dueAtInput).toISOString() : null;
    try { await command({ command: "create-action", title: form.get("title"), ownerName: form.get("ownerName"), priority: form.get("priority"), operationalNote: form.get("operationalNote"), dueAt, idempotencyKey: key }); keyRef.current = null; event.currentTarget.reset(); dialogRef.current?.close(); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "We could not assign this action."); } finally { setSubmitting(false); }
  }
  async function acknowledge(actionId: string) {
    const key = crypto.randomUUID(); setSubmitting(true); setError(null);
    try { await command({ command: "acknowledge-action", actionId, idempotencyKey: key }); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not acknowledge this action."); } finally { setSubmitting(false); }
  }
  async function advance(actionId: string, statusCommand: "complete-action" | "verify-action") {
    setSubmitting(true); setError(null);
    try { await commandRequest(actionId, statusCommand); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "We could not update this action."); } finally { setSubmitting(false); }
  }
  async function commandRequest(actionId: string, statusCommand: "complete-action" | "verify-action") { await command({ command: statusCommand, actionId, idempotencyKey: crypto.randomUUID() }); }
  return <><button className={styles.secondaryControl} type="button" onClick={() => dialogRef.current?.showModal()}>Assign action</button>{error ? <p className={styles.saveError} role="alert">{error}</p> : null}<div className={styles.actionList}>{actions.length ? actions.map((action) => <article className={styles.actionCard} key={action.id}><h3>{action.title}</h3><p>Owner: {action.owner_name}</p>{action.operational_note ? <p>{action.operational_note}</p> : null}<footer><span>{action.priority}</span><span>{action.status.replaceAll("_", " ")}</span></footer>{action.status === "assigned" ? <button className={styles.secondaryControl} type="button" disabled={submitting} onClick={() => acknowledge(action.id)}>Acknowledge action</button> : null}{action.status === "acknowledged" ? <button className={styles.secondaryControl} type="button" disabled={submitting} onClick={() => advance(action.id, "complete-action")}>Complete action</button> : null}{action.status === "completed" ? <button className={styles.secondaryControl} type="button" disabled={submitting} onClick={() => advance(action.id, "verify-action")}>Verify action</button> : null}</article>) : <p className={styles.emptyState}>No actions are assigned. Assign a clear, owned action when a response is required.</p>}</div>
    <dialog className={styles.archiveDialog} ref={dialogRef} aria-labelledby="action-title"><form onSubmit={createAction} className={styles.commandForm}><p className={styles.eyebrow}>Live coordination</p><h2 id="action-title">Assign incident action</h2><label className="field-label">Action<input className="text-input" name="title" required maxLength={300} disabled={submitting} /></label><label className="field-label">Owner or call sign<input className="text-input" name="ownerName" required maxLength={160} disabled={submitting} /></label><label className="field-label">Priority<select className="text-input" name="priority" defaultValue="immediate" disabled={submitting}><option value="immediate">Immediate</option><option value="high">High</option><option value="routine">Routine</option></select></label><label className="field-label">Due time, optional<input className="text-input" name="dueAt" type="datetime-local" disabled={submitting} /></label><label className="field-label">Operational note, optional<textarea className="text-input" name="operationalNote" maxLength={2000} disabled={submitting} /></label><div className={styles.commandActions}><button className={styles.secondaryControl} type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>Cancel</button><button className="primary-button" disabled={submitting}>{submitting ? "Assigning…" : "Assign action"}</button></div></form></dialog>
  </>;
}
