import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listDocumentTypes(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_types")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function listDocuments(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, document_types(name), created_by_profile:created_by(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDocument(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "*, events(id, reference, name), document_types(name), created_by_profile:created_by(first_name, surname, email), approved_by_profile:approved_by(first_name, surname, email), issued_by_profile:issued_by(first_name, surname, email)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listDocumentVersions(documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_versions")
    .select("*, profiles(first_name, surname, email)")
    .eq("document_id", documentId)
    .order("version_no", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listDocumentStatusHistory(documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_status_history")
    .select("*, profiles(first_name, surname, email)")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
