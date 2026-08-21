"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

export async function setIncidentClassificationAction(
  incidentId: string,
  classification: Enums<"classification_level">,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_incident_classification", {
    p_incident_id: incidentId,
    p_classification: classification,
  });
  if (error) return { error: error.message };
  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}

export async function setIncidentRestrictedNarrativeAction(incidentId: string, body: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_incident_restricted_narrative", {
    p_incident_id: incidentId,
    p_body: body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}
