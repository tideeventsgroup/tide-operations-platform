import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listIncidents(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(
      "*, controller:controller_id(first_name, surname, email), owner:owner_id(first_name, surname, email), operational_locations(name)",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getIncident(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(
      "*, events(id, reference, name, current_phase), controller:controller_id(first_name, surname, email), owner:owner_id(first_name, surname, email), operational_locations(name), closed_by_profile:closed_by(first_name, surname, email)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listIncidentTimeline(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_log_entries")
    .select("*, profiles(first_name, surname, email)")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listIncidentCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("incident_categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function listIncidentPriorities(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_priorities")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("rank");
  if (error) throw error;
  return data;
}
