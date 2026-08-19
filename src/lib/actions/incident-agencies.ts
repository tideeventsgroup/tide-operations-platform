"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

async function callRpc(
  fn: "notify_incident_agency" | "update_incident_agency_status",
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

export async function notifyIncidentAgencyAction(
  incidentId: string,
  agencyType: string,
  agencyName: string,
  contactName?: string,
  contactNumber?: string,
): Promise<ActionResult> {
  return callRpc(
    "notify_incident_agency",
    {
      p_incident_id: incidentId,
      p_agency_type: agencyType,
      p_agency_name: agencyName,
      p_contact_name: contactName || undefined,
      p_contact_number: contactNumber || undefined,
    },
    `/incidents/${incidentId}`,
  );
}

export async function updateIncidentAgencyStatusAction(
  incidentId: string,
  agencyId: string,
  status: Enums<"incident_agency_status">,
): Promise<ActionResult> {
  return callRpc(
    "update_incident_agency_status",
    { p_agency_id: agencyId, p_status: status },
    `/incidents/${incidentId}`,
  );
}
