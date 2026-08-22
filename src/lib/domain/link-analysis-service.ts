import "server-only";
import { createClient } from "@/lib/supabase/server";

// Surname/registration/etc. are free text on the source record (set via
// create_person/create_vehicle with no character restrictions), so they
// need the same PostgREST filter-syntax sanitization as user-supplied
// search terms before going into a `.or()` string.
function sanitizeFilterTerm(value: string) {
  return value.replace(/[,()*]/g, "").trim();
}

// Rule-based "possible match" surfacing — the safe version of Auror's
// AI-powered Connect the Dots. Matches on shared structured attributes
// only (surname, date of birth, registration, make/model/colour), never
// biometrics, and never auto-merges — a human always confirms via the
// existing "link existing person/vehicle" flow. See the vision doc's
// explicit instruction: human-created records and observation
// intelligence, not automatic facial recognition.
async function findSimilarPeople(person: { id: string; organisation_id: string; surname: string | null; date_of_birth: string | null }) {
  const surname = person.surname ? sanitizeFilterTerm(person.surname) : "";
  if (!surname && !person.date_of_birth) return [];
  const supabase = await createClient();
  const orFilters = [
    surname ? `surname.ilike.${surname}` : null,
    person.date_of_birth ? `date_of_birth.eq.${person.date_of_birth}` : null,
  ].filter(Boolean);
  if (orFilters.length === 0) return [];

  const { data, error } = await supabase
    .from("people")
    .select("id, reference, first_name, surname, date_of_birth")
    .eq("organisation_id", person.organisation_id)
    .eq("status", "active")
    .neq("id", person.id)
    .or(orFilters.join(","))
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

async function findSimilarVehicles(vehicle: {
  id: string;
  organisation_id: string;
  registration: string | null;
  make: string | null;
  model: string | null;
  colour: string | null;
}) {
  const registration = vehicle.registration ? sanitizeFilterTerm(vehicle.registration) : "";
  const make = vehicle.make ? sanitizeFilterTerm(vehicle.make) : "";
  const model = vehicle.model ? sanitizeFilterTerm(vehicle.model) : "";
  const colour = vehicle.colour ? sanitizeFilterTerm(vehicle.colour) : "";
  if (!registration && !(make && model)) return [];
  const supabase = await createClient();
  const orFilters = [
    registration ? `registration.ilike.${registration}` : null,
    make && model ? `and(make.ilike.${make},model.ilike.${model}${colour ? `,colour.ilike.${colour}` : ""})` : null,
  ].filter(Boolean);
  if (orFilters.length === 0) return [];

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, reference, registration, make, model, colour")
    .eq("organisation_id", vehicle.organisation_id)
    .eq("status", "active")
    .neq("id", vehicle.id)
    .or(orFilters.join(","))
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export async function getPersonProfile(id: string) {
  const supabase = await createClient();
  const { data: person, error } = await supabase.from("people").select("*").eq("id", id).single();
  if (error) throw error;

  const [{ data: incidentLinks, error: incErr }, { data: investigationLinks, error: invErr }, possibleMatches] = await Promise.all([
    supabase
      .from("incident_people")
      .select("*, incidents(id, reference, summary, status, event_id, events(name))")
      .eq("person_id", id)
      .order("linked_at", { ascending: false }),
    supabase
      .from("investigation_people")
      .select("*, investigations(id, reference, title, status)")
      .eq("person_id", id)
      .order("linked_at", { ascending: false }),
    findSimilarPeople(person),
  ]);
  if (incErr) throw incErr;
  if (invErr) throw invErr;

  return { person, incidentLinks: incidentLinks ?? [], investigationLinks: investigationLinks ?? [], possibleMatches };
}

export async function getVehicleProfile(id: string) {
  const supabase = await createClient();
  const { data: vehicle, error } = await supabase.from("vehicles").select("*").eq("id", id).single();
  if (error) throw error;

  const [{ data: incidentLinks, error: incErr }, { data: investigationLinks, error: invErr }, possibleMatches] = await Promise.all([
    supabase
      .from("incident_vehicles")
      .select("*, incidents(id, reference, summary, status, event_id, events(name))")
      .eq("vehicle_id", id)
      .order("linked_at", { ascending: false }),
    supabase
      .from("investigation_vehicles")
      .select("*, investigations(id, reference, title, status)")
      .eq("vehicle_id", id)
      .order("linked_at", { ascending: false }),
    findSimilarVehicles(vehicle),
  ]);
  if (incErr) throw incErr;
  if (invErr) throw invErr;

  return { vehicle, incidentLinks: incidentLinks ?? [], investigationLinks: investigationLinks ?? [], possibleMatches };
}
