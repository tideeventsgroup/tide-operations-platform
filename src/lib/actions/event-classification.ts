"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/events";

export async function setEventClassificationAction(
  eventId: string,
  classification: Enums<"classification_level">,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_event_classification", {
    p_event_id: eventId,
    p_classification: classification,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function setEventRestrictedNarrativeAction(eventId: string, body: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_event_restricted_narrative", {
    p_event_id: eventId,
    p_body: body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
