import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listRadioLogEntries(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("radio_log_entries")
    .select("*, logged_by_profile:logged_by(first_name, surname, email), linked_incident:linked_incident_id(id, reference)")
    .eq("event_id", eventId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return data;
}
