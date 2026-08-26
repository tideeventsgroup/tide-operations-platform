"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { searchPeople, searchVehicles } from "@/lib/domain/event-service";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/events";

export async function searchPeopleAction(organisationId: string, query: string) {
  return searchPeople(organisationId, query);
}

export async function searchVehiclesAction(organisationId: string, query: string) {
  return searchVehicles(organisationId, query);
}

async function callRpc(
  fn:
    | "create_person"
    | "link_existing_person_to_event"
    | "create_vehicle"
    | "link_existing_vehicle_to_event",
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

export async function createPersonAction(
  eventId: string,
  purpose: string,
  roleCode: string,
  fields: {
    firstName?: string;
    surname?: string;
    description?: string;
    dateOfBirth?: string;
    classification?: Enums<"classification_level">;
    notes?: string;
  },
): Promise<ActionResult> {
  return callRpc(
    "create_person",
    {
      p_event_id: eventId,
      p_purpose: purpose,
      p_role_code: roleCode,
      p_first_name: fields.firstName || undefined,
      p_surname: fields.surname || undefined,
      p_description: fields.description || undefined,
      p_date_of_birth: fields.dateOfBirth || undefined,
      p_classification: fields.classification || undefined,
      p_notes: fields.notes || undefined,
    },
    `/events/${eventId}`,
  );
}

export async function linkExistingPersonAction(
  eventId: string,
  personId: string,
  roleCode: string,
  notes?: string,
): Promise<ActionResult> {
  return callRpc(
    "link_existing_person_to_event",
    { p_event_id: eventId, p_person_id: personId, p_role_code: roleCode, p_notes: notes || undefined },
    `/events/${eventId}`,
  );
}

export async function createVehicleAction(
  eventId: string,
  purpose: string,
  roleCode: string,
  fields: {
    registration?: string;
    make?: string;
    model?: string;
    colour?: string;
    description?: string;
    classification?: Enums<"classification_level">;
    notes?: string;
  },
): Promise<ActionResult> {
  return callRpc(
    "create_vehicle",
    {
      p_event_id: eventId,
      p_purpose: purpose,
      p_role_code: roleCode,
      p_registration: fields.registration || undefined,
      p_make: fields.make || undefined,
      p_model: fields.model || undefined,
      p_colour: fields.colour || undefined,
      p_description: fields.description || undefined,
      p_classification: fields.classification || undefined,
      p_notes: fields.notes || undefined,
    },
    `/events/${eventId}`,
  );
}

export async function linkExistingVehicleAction(
  eventId: string,
  vehicleId: string,
  roleCode: string,
  notes?: string,
): Promise<ActionResult> {
  return callRpc(
    "link_existing_vehicle_to_event",
    { p_event_id: eventId, p_vehicle_id: vehicleId, p_role_code: roleCode, p_notes: notes || undefined },
    `/events/${eventId}`,
  );
}
