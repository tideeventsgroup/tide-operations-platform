"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

export type ActionResult = { error?: string; success?: boolean };

const createIncidentSchema = z.object({
  event_id: z.string().uuid(),
  category_code: z.string().min(1, { error: "Select a category." }),
  summary: z.string().trim().min(1, { error: "Enter a brief description." }),
  location_id: z.string().uuid().nullish(),
  description: z.string().trim().nullish(),
  priority_code: z.string().nullish(),
  report_source: z.string().nullish(),
});

export async function createIncidentAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createIncidentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };

  const supabase = await createClient();
  const { data: incidentId, error } = await supabase.rpc("create_incident", {
    p_event_id: parsed.data.event_id,
    p_category_code: parsed.data.category_code,
    p_summary: parsed.data.summary,
    p_location_id: parsed.data.location_id || undefined,
    p_description: parsed.data.description || undefined,
    p_priority_code: parsed.data.priority_code || undefined,
    p_report_source: (parsed.data.report_source as Enums<"report_source">) || undefined,
  });

  if (error) return { error: error.message };

  revalidatePath(`/events/${parsed.data.event_id}/incidents`);
  redirect(`/incidents/${incidentId}`);
}

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
