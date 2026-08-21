"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { searchEvidenceItems, searchIncidents } from "@/lib/domain/investigation-service";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

export async function searchIncidentsAction(organisationId: string, query: string) {
  return searchIncidents(organisationId, query);
}

export async function searchEvidenceItemsAction(organisationId: string, query: string) {
  return searchEvidenceItems(organisationId, query);
}

export async function createInvestigationAction(
  organisationId: string,
  title: string,
  summary?: string,
  classification?: Enums<"classification_level">,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: investigationId, error } = await supabase.rpc("create_investigation", {
    p_organisation_id: organisationId,
    p_title: title,
    p_summary: summary || undefined,
    p_classification: classification || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath("/investigations");
  redirect(`/investigations/${investigationId}`);
}

async function callRpc(
  fn:
    | "link_incident_to_investigation"
    | "link_person_to_investigation"
    | "link_vehicle_to_investigation"
    | "link_evidence_to_investigation"
    | "add_investigation_note"
    | "update_investigation_status",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  investigationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  revalidatePath(`/investigations/${investigationId}`);
  return { success: true };
}

export async function linkIncidentToInvestigationAction(investigationId: string, incidentId: string): Promise<ActionResult> {
  return callRpc("link_incident_to_investigation", { p_investigation_id: investigationId, p_incident_id: incidentId }, investigationId);
}

export async function linkPersonToInvestigationAction(
  investigationId: string,
  personId: string,
  roleCode: string,
  notes?: string,
): Promise<ActionResult> {
  return callRpc(
    "link_person_to_investigation",
    { p_investigation_id: investigationId, p_person_id: personId, p_role_code: roleCode, p_notes: notes || undefined },
    investigationId,
  );
}

export async function linkVehicleToInvestigationAction(
  investigationId: string,
  vehicleId: string,
  roleCode: string,
  notes?: string,
): Promise<ActionResult> {
  return callRpc(
    "link_vehicle_to_investigation",
    { p_investigation_id: investigationId, p_vehicle_id: vehicleId, p_role_code: roleCode, p_notes: notes || undefined },
    investigationId,
  );
}

export async function linkEvidenceToInvestigationAction(investigationId: string, evidenceItemId: string): Promise<ActionResult> {
  return callRpc(
    "link_evidence_to_investigation",
    { p_investigation_id: investigationId, p_evidence_item_id: evidenceItemId },
    investigationId,
  );
}

export async function addInvestigationNoteAction(investigationId: string, body: string): Promise<ActionResult> {
  return callRpc("add_investigation_note", { p_investigation_id: investigationId, p_body: body }, investigationId);
}

export async function updateInvestigationStatusAction(
  investigationId: string,
  status: Enums<"investigation_status">,
  reason?: string,
): Promise<ActionResult> {
  return callRpc(
    "update_investigation_status",
    { p_investigation_id: investigationId, p_status: status, p_reason: reason || undefined },
    investigationId,
  );
}
