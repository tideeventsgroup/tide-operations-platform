import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sanitizeFilterTerm } from "@/lib/domain/postgrest-filter";

// Org-wide case list — /investigations. Linked-record and linked-operation
// counts come from the same junction table listInvestigationIncidents()
// uses, just embedded here so the list doesn't need N+1 queries.
export async function listInvestigations(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigations")
    .select("*, lead_investigator:lead_investigator_id(first_name, surname, email), investigation_events(events(operation_id))")
    .eq("organisation_id", organisationId)
    .order("opened_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getInvestigation(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigations")
    .select(
      "*, lead_investigator:lead_investigator_id(first_name, surname, email), opened_by_profile:opened_by(first_name, surname, email)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listInvestigationIncidents(investigationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigation_events")
    .select("*, events(id, reference, summary, status, operation_id)")
    .eq("investigation_id", investigationId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listInvestigationPeople(investigationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigation_people")
    .select("*, people(*)")
    .eq("investigation_id", investigationId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listInvestigationVehicles(investigationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigation_vehicles")
    .select("*, vehicles(*)")
    .eq("investigation_id", investigationId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listInvestigationEvidence(investigationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigation_evidence")
    .select("*, evidence_items(*)")
    .eq("investigation_id", investigationId)
    .order("linked_at", { ascending: false });
  if (error) throw error;
  return data;
}

// RLS is the authorisation boundary — this just narrows the candidate set.
export async function searchIncidents(organisationId: string, query: string) {
  const term = sanitizeFilterTerm(query);
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, reference, summary, status")
    .eq("organisation_id", organisationId)
    .or(`reference.ilike.%${term}%,summary.ilike.%${term}%`)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function searchEvidenceItems(organisationId: string, query: string) {
  const term = sanitizeFilterTerm(query);
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evidence_items")
    .select("id, reference, description, item_type")
    .eq("organisation_id", organisationId)
    .or(`reference.ilike.%${term}%,description.ilike.%${term}%`)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function listInvestigationNotes(investigationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investigation_notes")
    .select("*, author:author_id(first_name, surname, email)")
    .eq("investigation_id", investigationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}
