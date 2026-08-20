"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/incidents";

export async function logRadioEntryAction(
  eventId: string,
  message: string,
  fields: { channel?: string; fromCallsign?: string; toCallsign?: string; significant?: boolean; linkedIncidentId?: string },
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("log_radio_entry", {
    p_event_id: eventId,
    p_message: message,
    p_channel: fields.channel || undefined,
    p_from_callsign: fields.fromCallsign || undefined,
    p_to_callsign: fields.toCallsign || undefined,
    p_significant: fields.significant ?? false,
    p_linked_incident_id: fields.linkedIncidentId || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}/radio-log`);
  return { success: true };
}
