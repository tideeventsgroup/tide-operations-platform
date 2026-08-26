import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listRadioLogEntries(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("radio_log_entries")
    .select("*, logged_by_profile:logged_by(first_name, surname, email), linked_event:linked_event_id(id, reference)")
    .eq("operation_id", operationId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return data;
}
