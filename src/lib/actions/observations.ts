"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

async function callRpc(
  fn: "create_observation" | "update_observation_status" | "promote_observation_to_incident",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  revalidate: string,
): Promise<ActionResult & { incidentId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  revalidatePath(revalidate);
  return { success: true, incidentId: typeof data === "string" ? data : undefined };
}

export async function createObservationAction(
  eventId: string,
  category: string,
  summary: string,
  fields: { description?: string; locationId?: string; classification?: Enums<"classification_level"> },
): Promise<ActionResult> {
  return callRpc(
    "create_observation",
    {
      p_event_id: eventId,
      p_category: category,
      p_summary: summary,
      p_description: fields.description || undefined,
      p_location_id: fields.locationId || undefined,
      p_classification: fields.classification || undefined,
    },
    `/events/${eventId}/observations`,
  );
}

export async function updateObservationStatusAction(
  eventId: string,
  observationId: string,
  status: Enums<"observation_status">,
  dismissedReason?: string,
): Promise<ActionResult> {
  return callRpc(
    "update_observation_status",
    { p_observation_id: observationId, p_status: status, p_dismissed_reason: dismissedReason || undefined },
    `/events/${eventId}/observations`,
  );
}

export async function promoteObservationAction(
  eventId: string,
  observationId: string,
  categoryCode: string,
  priorityCode?: string,
): Promise<ActionResult & { incidentId?: string }> {
  return callRpc(
    "promote_observation_to_incident",
    { p_observation_id: observationId, p_category_code: categoryCode, p_priority_code: priorityCode || undefined },
    `/events/${eventId}/observations`,
  );
}
