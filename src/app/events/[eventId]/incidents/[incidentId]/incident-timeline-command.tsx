"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { retainIdempotencyKey } from "@/modules/commands/idempotency";
import styles from "./incident-workspace.module.css";

type Props = { eventId: string; incidentId: string };

export function IncidentTimelineCommand({ eventId, incidentId }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const keyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const key = retainIdempotencyKey(keyRef.current, () => crypto.randomUUID());
    keyRef.current = key;
    setSubmitting(true); setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/incidents/${incidentId}/operational`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "append", entryType: form.get("entryType"), source: form.get("source"), content: form.get("content"), occurredAt: new Date().toISOString(), idempotencyKey: key }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setError(payload.error ?? "We could not record this update."); return; }
      keyRef.current = null; event.currentTarget.reset(); dialogRef.current?.close(); router.refresh();
    } catch { setError("Connection lost before confirmation. Retry to safely finish this update."); }
    finally { setSubmitting(false); }
  }

  return <>
    <section className={styles.timelineComposer}><div><h3>Record an operational update</h3><p>Timestamped, attributed and retained as part of this incident record.</p></div><button className="primary-button" type="button" onClick={() => dialogRef.current?.showModal()}>Add update</button></section>
    <dialog className={styles.archiveDialog} ref={dialogRef} aria-labelledby="timeline-entry-title"><form onSubmit={submit} className={styles.commandForm}>
      <p className={styles.eyebrow}>Append-only history</p><h2 id="timeline-entry-title">Add operational update</h2><p>Record what changed, what is being done, or what requires Event Control attention next.</p>
      <label className="field-label">Entry type<select className="text-input" name="entryType" defaultValue="operational_update" disabled={submitting}><option value="operational_update">Operational update</option><option value="deployment">Deployment</option><option value="agency_contact">Agency contact</option><option value="outcome">Outcome</option></select></label>
      <label className="field-label">Source<select className="text-input" name="source" defaultValue="operator" disabled={submitting}><option value="operator">Event Control</option><option value="radio">Radio</option><option value="in_person">In person</option><option value="telephone">Telephone</option><option value="field_reporter">Field reporter</option></select></label>
      <label className="field-label">Update<textarea className="text-input" name="content" required maxLength={4000} disabled={submitting} /></label>
      {error ? <p className={styles.saveError} role="alert">{error}</p> : null}<div className={styles.commandActions}><button className={styles.secondaryControl} type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>Cancel</button><button className="primary-button" disabled={submitting}>{submitting ? "Publishing…" : "Publish update"}</button></div>
    </form></dialog>
  </>;
}
