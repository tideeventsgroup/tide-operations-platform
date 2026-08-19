import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listPortalEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, clients(legal_name, trading_name)")
    .eq("portal_enabled", true)
    .order("start_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function getPortalEvent(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, clients(legal_name, trading_name)")
    .eq("id", id)
    .eq("portal_enabled", true)
    .single();
  if (error) throw error;
  return data;
}

// Client-facing document visibility is deliberately narrower than
// document.view's RLS allows — issued + non-internal classification only,
// filtered explicitly here rather than trusting RLS alone. See
// docs/data-classification.md and Phase 8's classification comment.
export async function listPortalDocuments(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, document_types(name)")
    .eq("event_id", eventId)
    .eq("status", "issued")
    .in("classification", ["public", "client"])
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPortalIncidentSummary(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_portal_incident_summary", { p_event_id: eventId }).single();
  if (error) throw error;
  return data;
}
