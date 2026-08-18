"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

async function callRpc(
  fn:
    | "create_incident_action"
    | "complete_incident_action"
    | "cancel_incident_action"
    | "record_incident_decision"
    | "request_incident_resource"
    | "update_incident_resource_status",
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

export async function createIncidentActionAction(
  incidentId: string,
  description: string,
  assignedTo?: string,
  dueAt?: string,
): Promise<ActionResult> {
  return callRpc(
    "create_incident_action",
    { p_incident_id: incidentId, p_description: description, p_assigned_to: assignedTo || undefined, p_due_at: dueAt || undefined },
    `/incidents/${incidentId}`,
  );
}

export async function completeIncidentActionAction(incidentId: string, actionId: string, note?: string): Promise<ActionResult> {
  return callRpc("complete_incident_action", { p_action_id: actionId, p_note: note || undefined }, `/incidents/${incidentId}`);
}

export async function cancelIncidentActionAction(incidentId: string, actionId: string, reason: string): Promise<ActionResult> {
  return callRpc("cancel_incident_action", { p_action_id: actionId, p_reason: reason }, `/incidents/${incidentId}`);
}

export async function recordIncidentDecisionAction(
  incidentId: string,
  decision: string,
  rationale?: string,
): Promise<ActionResult> {
  return callRpc(
    "record_incident_decision",
    { p_incident_id: incidentId, p_decision: decision, p_rationale: rationale || undefined },
    `/incidents/${incidentId}`,
  );
}

export async function requestIncidentResourceAction(
  incidentId: string,
  resourceType: string,
  description?: string,
): Promise<ActionResult> {
  return callRpc(
    "request_incident_resource",
    { p_incident_id: incidentId, p_resource_type: resourceType, p_description: description || undefined },
    `/incidents/${incidentId}`,
  );
}

export async function updateIncidentResourceStatusAction(
  incidentId: string,
  resourceId: string,
  status: Enums<"incident_resource_status">,
): Promise<ActionResult> {
  return callRpc(
    "update_incident_resource_status",
    { p_resource_id: resourceId, p_status: status },
    `/incidents/${incidentId}`,
  );
}
