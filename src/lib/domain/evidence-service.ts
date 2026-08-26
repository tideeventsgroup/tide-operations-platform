import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listEvidenceItems(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evidence_items")
    .select("*, logged_by_profile:logged_by(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEvidenceCustodyLog(evidenceItemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evidence_custody_log")
    .select("*, actor:actor_id(first_name, surname, email)")
    .eq("evidence_item_id", evidenceItemId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}
