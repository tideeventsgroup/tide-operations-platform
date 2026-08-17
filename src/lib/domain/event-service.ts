import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

export async function listEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, clients(legal_name, trading_name)")
    .order("start_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function getEvent(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, clients(id, legal_name, trading_name, reference)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listEventStageHistory(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_stage_history")
    .select("*, profiles(first_name, surname, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listEventCharacteristics(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_characteristics")
    .select("characteristic_code")
    .eq("event_id", eventId);
  if (error) throw error;
  return data.map((r) => r.characteristic_code);
}

export async function listCharacteristicTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("characteristic_types").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function listEventLocations(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operational_locations")
    .select("*")
    .eq("event_id", eventId)
    .order("type")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createEventRecord(
  input: Omit<TablesInsert<"events">, "reference"> & { organisation_id: string },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...input, reference: "" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEventRecord(id: string, input: Partial<TablesInsert<"events">>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
