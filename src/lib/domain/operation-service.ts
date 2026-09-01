import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

export async function listOperations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operations")
    .select("*, clients(legal_name, trading_name)")
    .order("start_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function getOperation(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operations")
    .select("*, clients(id, legal_name, trading_name, reference)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listOperationStageHistory(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operation_stage_history")
    .select("*, profiles(first_name, surname, email)")
    .eq("operation_id", operationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listOperationCharacteristics(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operation_characteristics")
    .select("characteristic_code")
    .eq("operation_id", operationId);
  if (error) throw error;
  return data.map((r) => r.characteristic_code);
}

export async function listCharacteristicTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("characteristic_types").select("*").order("sort_order").order("name");
  if (error) throw error;
  return data;
}

export async function listOperationLocations(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operational_locations")
    .select("*")
    .eq("operation_id", operationId)
    .order("type")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listControlRoles(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operation_control_roles")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

// Structured control points — inner/outer cordons, rendezvous points,
// casualty clearing stations — real LESLP/JESIP doctrine rather than free
// text. Open ones first (most operationally relevant), then most recent.
export async function listOperationCordons(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_cordons")
    .select("*, established_by_profile:established_by(first_name, surname, email), events(reference)")
    .eq("operation_id", operationId)
    .order("closed_at", { ascending: true, nullsFirst: true })
    .order("established_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listControlSessions(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operation_control_sessions")
    .select("*, profiles!profile_id(first_name, surname, email), operation_control_roles(name)")
    .eq("operation_id", operationId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createOperationRecord(
  input: Omit<TablesInsert<"operations">, "reference"> & { organisation_id: string },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operations")
    .insert({ ...input, reference: "" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOperationRecord(id: string, input: Partial<TablesInsert<"operations">>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("operations").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
