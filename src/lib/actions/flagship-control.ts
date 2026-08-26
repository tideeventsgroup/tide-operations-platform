"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/events";

async function callRpc(
  fn:
    | "start_control_session"
    | "end_control_session"
    | "create_methane_message"
    | "activate_major_incident"
    | "deactivate_major_incident",
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

export async function startControlSessionAction(operationId: string, roleId: string): Promise<ActionResult> {
  return callRpc("start_control_session", { p_operation_id: operationId, p_role_id: roleId }, `/operations/${operationId}`);
}

export async function endControlSessionAction(operationId: string, sessionId: string): Promise<ActionResult> {
  return callRpc("end_control_session", { p_session_id: sessionId }, `/operations/${operationId}`);
}

export async function createMethaneMessageAction(
  eventId: string,
  fields: {
    majorIncidentDeclared: boolean;
    exactLocation: string;
    incidentType: string;
    hazards?: string;
    accessAndEgress?: string;
    casualties?: string;
    emergencyServices?: string;
  },
): Promise<ActionResult> {
  return callRpc(
    "create_methane_message",
    {
      p_event_id: eventId,
      p_major_incident_declared: fields.majorIncidentDeclared,
      p_exact_location: fields.exactLocation,
      p_incident_type: fields.incidentType,
      p_hazards: fields.hazards || undefined,
      p_access_and_egress: fields.accessAndEgress || undefined,
      p_casualties: fields.casualties || undefined,
      p_emergency_services: fields.emergencyServices || undefined,
    },
    `/events/${eventId}`,
  );
}

export async function activateMajorIncidentAction(eventId: string, reason: string): Promise<ActionResult> {
  return callRpc("activate_major_incident", { p_event_id: eventId, p_reason: reason }, `/events/${eventId}`);
}

export async function deactivateMajorIncidentAction(eventId: string, reason?: string): Promise<ActionResult> {
  return callRpc(
    "deactivate_major_incident",
    { p_event_id: eventId, p_reason: reason || undefined },
    `/events/${eventId}`,
  );
}
