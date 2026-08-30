import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sanitizeFilterTerm } from "@/lib/domain/postgrest-filter";

export async function listEvents(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "*, controller:controller_id(first_name, surname, email), owner:owner_id(first_name, surname, email), operational_locations(name)",
    )
    .eq("operation_id", operationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getEvent(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "*, operations(id, reference, name, current_phase), controller:controller_id(first_name, surname, email), owner:owner_id(first_name, surname, email), operational_locations(name), closed_by_profile:closed_by(first_name, surname, email)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listEventTimeline(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_log_entries")
    .select("*, profiles(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listEventActions(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_actions")
    .select("*, assignee:assigned_to(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEventDecisions(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_decisions")
    .select("*, decided_by_profile:decided_by(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("decided_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEventResources(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_resources")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listMethaneVersions(eventId: string) {
  const supabase = await createClient();
  const { data: message, error: messageError } = await supabase
    .from("methane_messages")
    .select("id, reference")
    .eq("event_id", eventId)
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

export async function getActiveMajorIncidentActivation(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("major_incident_activations")
    .select("*, activated_by_profile:activated_by(first_name, surname, email)")
    .eq("event_id", eventId)
    .is("deactivated_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listActiveMajorIncidentsForOperation(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("major_incident_activations")
    .select("*, activated_by_profile:activated_by(first_name, surname, email), events!inner(id, reference, summary, operation_id)")
    .eq("events.operation_id", operationId)
    .is("deactivated_at", null);
  if (error) throw error;
  return data;
}

export async function listEventAgencies(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_agencies")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEventCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("event_categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function listCrimeClassifications() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("crime_classifications").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function listEventPriorities(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_priorities")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("rank");
  if (error) throw error;
  return data;
}

export async function getEventRestrictedNarrative(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_restricted_narrative")
    .select("*, created_by_profile:created_by(first_name, surname, email), updated_by_profile:updated_by(first_name, surname, email)")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listEventPeople(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_people")
    .select("*, people(*), linked_by_profile:linked_by(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEventVehicles(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_vehicles")
    .select("*, vehicles(*), linked_by_profile:linked_by(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

// RLS (intelligence.view, organisation-wide) is the authorisation boundary
// here, not this query — see docs/data-classification.md. Returns only
// the fields needed to identify a record for linking, not the full record.
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
