"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

export type ActionResult = { error?: string; success?: boolean };

async function callVoidRpc(
  fn:
    | "acknowledge_event"
    | "assign_event_controller"
    | "assign_event_owner"
    | "change_event_priority"
    | "resolve_event"
    | "close_event"
    | "reopen_event",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  revalidate: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  revalidatePath(revalidate);
  return { success: true };
}

export async function acknowledgeEventAction(eventId: string): Promise<ActionResult> {
  return callVoidRpc("acknowledge_event", { p_event_id: eventId }, `/events/${eventId}`);
}

export async function assignControllerAction(eventId: string, controllerId?: string): Promise<ActionResult> {
  return callVoidRpc(
    "assign_event_controller",
    { p_event_id: eventId, p_controller_id: controllerId },
    `/events/${eventId}`,
  );
}

export async function assignOwnerAction(eventId: string, ownerId: string): Promise<ActionResult> {
  return callVoidRpc(
    "assign_event_owner",
    { p_event_id: eventId, p_owner_id: ownerId },
    `/events/${eventId}`,
  );
}

export async function changePriorityAction(
  eventId: string,
  priorityCode: string,
  reason?: string,
): Promise<ActionResult> {
  return callVoidRpc(
    "change_event_priority",
    { p_event_id: eventId, p_new_priority_code: priorityCode, p_reason: reason },
    `/events/${eventId}`,
  );
}

export async function resolveEventAction(eventId: string, resolution: string): Promise<ActionResult> {
  return callVoidRpc(
    "resolve_event",
    { p_event_id: eventId, p_resolution: resolution },
    `/events/${eventId}`,
  );
}

export async function closeEventAction(eventId: string, closureSummary: string): Promise<ActionResult> {
  return callVoidRpc(
    "close_event",
    { p_event_id: eventId, p_closure_summary: closureSummary },
    `/events/${eventId}`,
  );
}

export async function reopenEventAction(eventId: string, reason: string): Promise<ActionResult> {
  return callVoidRpc("reopen_event", { p_event_id: eventId, p_reason: reason }, `/events/${eventId}`);
}

export async function appendLogEntryAction(
  eventId: string,
  entryType: Enums<"event_log_entry_type">,
  body: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("append_event_log_entry", {
    p_event_id: eventId,
    p_entry_type: entryType,
    p_body: body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function addCorrectionAction(
  eventId: string,
  correctsEntryId: string,
  body: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_event_correction", {
    p_event_id: eventId,
    p_corrects_entry_id: correctsEntryId,
    p_body: body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
