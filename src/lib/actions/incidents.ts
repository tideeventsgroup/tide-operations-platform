"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

export type ActionResult = { error?: string; success?: boolean };

async function callVoidRpc(
  fn:
    | "acknowledge_incident"
    | "assign_incident_controller"
    | "assign_incident_owner"
    | "change_incident_priority"
    | "resolve_incident"
    | "close_incident"
    | "reopen_incident",
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

export async function acknowledgeIncidentAction(incidentId: string): Promise<ActionResult> {
  return callVoidRpc("acknowledge_incident", { p_incident_id: incidentId }, `/incidents/${incidentId}`);
}

export async function assignControllerAction(incidentId: string, controllerId?: string): Promise<ActionResult> {
  return callVoidRpc(
    "assign_incident_controller",
    { p_incident_id: incidentId, p_controller_id: controllerId },
    `/incidents/${incidentId}`,
  );
}

export async function assignOwnerAction(incidentId: string, ownerId: string): Promise<ActionResult> {
  return callVoidRpc(
    "assign_incident_owner",
    { p_incident_id: incidentId, p_owner_id: ownerId },
    `/incidents/${incidentId}`,
  );
}

export async function changePriorityAction(
  incidentId: string,
  priorityCode: string,
  reason?: string,
): Promise<ActionResult> {
  return callVoidRpc(
    "change_incident_priority",
    { p_incident_id: incidentId, p_new_priority_code: priorityCode, p_reason: reason },
    `/incidents/${incidentId}`,
  );
}

export async function resolveIncidentAction(incidentId: string, resolution: string): Promise<ActionResult> {
  return callVoidRpc(
    "resolve_incident",
    { p_incident_id: incidentId, p_resolution: resolution },
    `/incidents/${incidentId}`,
  );
}

export async function closeIncidentAction(incidentId: string, closureSummary: string): Promise<ActionResult> {
  return callVoidRpc(
    "close_incident",
    { p_incident_id: incidentId, p_closure_summary: closureSummary },
    `/incidents/${incidentId}`,
  );
}

export async function reopenIncidentAction(incidentId: string, reason: string): Promise<ActionResult> {
  return callVoidRpc("reopen_incident", { p_incident_id: incidentId, p_reason: reason }, `/incidents/${incidentId}`);
}

export async function appendLogEntryAction(
  incidentId: string,
  entryType: Enums<"incident_log_entry_type">,
  body: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("append_incident_log_entry", {
    p_incident_id: incidentId,
    p_entry_type: entryType,
    p_body: body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}

export async function addCorrectionAction(
  incidentId: string,
  correctsEntryId: string,
  body: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_incident_correction", {
    p_incident_id: incidentId,
    p_corrects_entry_id: correctsEntryId,
    p_body: body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}
