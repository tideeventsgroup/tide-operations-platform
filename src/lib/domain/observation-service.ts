import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listObservations(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("observations")
    .select(
      "*, operational_locations(name), reported_by_profile:reported_by_profile_id(first_name, surname, email), reviewed_by_profile:reviewed_by(first_name, surname, email), promoted_event:promoted_event_id(id, reference)",
    )
    .eq("operation_id", operationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getObservation(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("observations")
    .select(
      "*, operations(id, reference, name, organisation_id), operational_locations(name), reported_by_profile:reported_by_profile_id(first_name, surname, email), promoted_event:promoted_event_id(id, reference)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
