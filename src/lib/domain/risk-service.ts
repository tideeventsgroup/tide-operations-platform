import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listRisks(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("risks")
    .select("*, owner:owner_id(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("risk_score", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listReadinessChecklist(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_checklist_items")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function listEventReadinessChecks(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_readiness_checks")
    .select("*, profiles(first_name, surname, email)")
    .eq("event_id", eventId);
  if (error) throw error;
  return data;
}
