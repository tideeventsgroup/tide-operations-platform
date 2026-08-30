"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/events";

async function callRpc(
  fn: "notify_event_agency" | "update_event_agency_status",
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

export async function notifyEventAgencyAction(
  eventId: string,
  agencyType: string,
  agencyName: string,
  contactName?: string,
  contactNumber?: string,
): Promise<ActionResult> {
  return callRpc(
    "notify_event_agency",
    {
      p_event_id: eventId,
      p_agency_type: agencyType,
      p_agency_name: agencyName,
      p_contact_name: contactName || undefined,
      p_contact_number: contactNumber || undefined,
    },
    `/events/${eventId}`,
  );
}

export async function updateEventAgencyStatusAction(
  eventId: string,
  agencyId: string,
  status: Enums<"event_agency_status">,
): Promise<ActionResult> {
  return callRpc(
    "update_event_agency_status",
    { p_agency_id: agencyId, p_status: status },
    `/events/${eventId}`,
  );
}

export async function updateEventPoliceDetailsAction(
  eventId: string,
  crimeClassificationCode: string | null,
  policeReference: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_event_police_details", {
    p_event_id: eventId,
    p_crime_classification_code: crimeClassificationCode || undefined,
    p_police_reference: policeReference || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
