import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listObservations(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("observations")
    .select(
      "*, operational_locations(name), reported_by_profile:reported_by_profile_id(first_name, surname, email), reviewed_by_profile:reviewed_by(first_name, surname, email), promoted_incident:promoted_incident_id(id, reference)",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getObservation(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("observations")
    .select(
      "*, events(id, reference, name, organisation_id), operational_locations(name), reported_by_profile:reported_by_profile_id(first_name, surname, email), promoted_incident:promoted_incident_id(id, reference)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
