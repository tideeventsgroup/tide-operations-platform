"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/events";

async function callRpc(
  fn:
    | "create_event_action"
    | "complete_event_action"
    | "cancel_event_action"
    | "record_event_decision"
    | "request_event_resource"
    | "update_event_resource_status",
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

export async function createEventActionAction(
  eventId: string,
  description: string,
  assignedTo?: string,
  dueAt?: string,
): Promise<ActionResult> {
  return callRpc(
    "create_event_action",
    { p_event_id: eventId, p_description: description, p_assigned_to: assignedTo || undefined, p_due_at: dueAt || undefined },
    `/events/${eventId}`,
  );
}

export async function completeEventActionAction(eventId: string, actionId: string, note?: string): Promise<ActionResult> {
  return callRpc("complete_event_action", { p_action_id: actionId, p_note: note || undefined }, `/events/${eventId}`);
}

export async function cancelEventActionAction(eventId: string, actionId: string, reason: string): Promise<ActionResult> {
  return callRpc("cancel_event_action", { p_action_id: actionId, p_reason: reason }, `/events/${eventId}`);
}

export async function recordEventDecisionAction(
  eventId: string,
  decision: string,
  rationale?: string,
): Promise<ActionResult> {
  return callRpc(
    "record_event_decision",
    { p_event_id: eventId, p_decision: decision, p_rationale: rationale || undefined },
    `/events/${eventId}`,
  );
}

export async function requestEventResourceAction(
  eventId: string,
  resourceType: string,
  description?: string,
): Promise<ActionResult> {
  return callRpc(
    "request_event_resource",
    { p_event_id: eventId, p_resource_type: resourceType, p_description: description || undefined },
    `/events/${eventId}`,
  );
}

export async function updateEventResourceStatusAction(
  eventId: string,
  resourceId: string,
  status: Enums<"event_resource_status">,
): Promise<ActionResult> {
  return callRpc(
    "update_event_resource_status",
    { p_resource_id: resourceId, p_status: status },
    `/events/${eventId}`,
  );
}
