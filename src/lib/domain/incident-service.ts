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

export async function listIncidentActions(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_actions")
    .select("*, assignee:assigned_to(first_name, surname, email)")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listIncidentDecisions(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_decisions")
    .select("*, decided_by_profile:decided_by(first_name, surname, email)")
    .eq("incident_id", incidentId)
    .order("decided_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listIncidentResources(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_resources")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listMethaneVersions(incidentId: string) {
  const supabase = await createClient();
  const { data: message, error: messageError } = await supabase
    .from("methane_messages")
    .select("id, reference")
    .eq("incident_id", incidentId)
    .maybeSingle();
  if (messageError) throw messageError;
  if (!message) return { message: null, versions: [] };

  const { data: versions, error } = await supabase
    .from("methane_message_versions")
    .select("*, profiles(first_name, surname, email)")
    .eq("methane_message_id", message.id)
    .order("version_no", { ascending: false });
  if (error) throw error;
  return { message, versions };
}

export async function getActiveMajorIncidentActivation(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("major_incident_activations")
    .select("*, activated_by_profile:activated_by(first_name, surname, email)")
    .eq("incident_id", incidentId)
    .is("deactivated_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listActiveMajorIncidentsForEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("major_incident_activations")
    .select("*, activated_by_profile:activated_by(first_name, surname, email), incidents!inner(id, reference, summary, event_id)")
    .eq("incidents.event_id", eventId)
    .is("deactivated_at", null);
  if (error) throw error;
  return data;
}

export async function listIncidentAgencies(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_agencies")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });
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

export async function listIncidentPeople(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_people")
    .select("*, people(*), linked_by_profile:linked_by(first_name, surname, email)")
    .eq("incident_id", incidentId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listIncidentVehicles(incidentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_vehicles")
    .select("*, vehicles(*), linked_by_profile:linked_by(first_name, surname, email)")
    .eq("incident_id", incidentId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

// RLS (intelligence.view, organisation-wide) is the authorisation boundary
// here, not this query — see docs/data-classification.md. Returns only
// the fields needed to identify a record for linking, not the full record.
// Strips PostgREST filter-syntax characters (,()*) from the input before
// it goes into .or() — those are structural in a filter string, not just
// search text, so raw user input can't be allowed to carry them through.
function sanitizeFilterTerm(query: string) {
  return query.replace(/[,()*]/g, "").trim();
}

export async function searchPeople(organisationId: string, query: string) {
  const term = sanitizeFilterTerm(query);
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, reference, first_name, surname, description")
    .eq("organisation_id", organisationId)
    .eq("status", "active")
    .or(`first_name.ilike.%${term}%,surname.ilike.%${term}%,reference.ilike.%${term}%`)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function searchVehicles(organisationId: string, query: string) {
  const term = sanitizeFilterTerm(query);
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, reference, registration, make, model, colour")
    .eq("organisation_id", organisationId)
    .eq("status", "active")
    .or(`registration.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%,reference.ilike.%${term}%`)
    .limit(10);
  if (error) throw error;
  return data;
}
