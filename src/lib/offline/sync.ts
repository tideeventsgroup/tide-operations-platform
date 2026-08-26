import { createClient } from "@/lib/supabase/client";
import { deletePendingIncident, getAllPendingIncidents, type PendingIncident } from "@/lib/offline/db";
import { refreshPendingCount } from "@/lib/offline/pending-store";

let flushing = false;

function toRpcArgs(record: PendingIncident) {
  return {
    p_operation_id: record.operation_id,
    p_category_code: record.category_code,
    p_summary: record.summary,
    p_location_id: record.location_id || undefined,
    p_description: record.description || undefined,
    p_priority_code: record.priority_code || undefined,
    p_report_source: record.report_source || undefined,
  };
}

export async function flushPendingIncidents(): Promise<{ synced: number; remaining: number }> {
  if (flushing) return { synced: 0, remaining: 0 };
  flushing = true;
  let synced = 0;
  try {
    const pending = await getAllPendingIncidents();
    if (pending.length === 0) return { synced: 0, remaining: 0 };

    const supabase = createClient();
    for (const record of pending) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.rpc("create_event", toRpcArgs(record) as any);
      if (error) {
        // Network/offline errors mean every subsequent attempt will fail
        // too this round — stop and retry later rather than looping
        // through a queue that can't currently sync. A genuine validation
        // error on one record shouldn't be silently dropped either, so it
        // stays queued for a human to notice and correct.
        break;
      }
      await deletePendingIncident(record.localId);
      synced += 1;
    }
    await refreshPendingCount();
    const remaining = (await getAllPendingIncidents()).length;
    return { synced, remaining };
  } finally {
    flushing = false;
  }
}
