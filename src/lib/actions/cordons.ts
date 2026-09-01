"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/events";

export async function establishCordonAction(
  operationId: string,
  fields: {
    type: Enums<"cordon_type">;
    label: string;
    eventId?: string;
    locationDescription?: string;
    what3words?: string;
    notes?: string;
  },
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("establish_cordon", {
    p_operation_id: operationId,
    p_type: fields.type,
    p_label: fields.label,
    p_event_id: fields.eventId || undefined,
    p_location_description: fields.locationDescription || undefined,
    p_what3words: fields.what3words?.trim().replace(/^\/+/, "") || undefined,
    p_notes: fields.notes || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath(`/operations/${operationId}`);
  revalidatePath(`/operations/${operationId}/wall`);
  if (fields.eventId) revalidatePath(`/events/${fields.eventId}`);
  return { success: true };
}

export async function closeCordonAction(cordonId: string, operationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_cordon", { p_cordon_id: cordonId });
  if (error) return { error: error.message };
  revalidatePath(`/operations/${operationId}`);
  revalidatePath(`/operations/${operationId}/wall`);
  return { success: true };
}
