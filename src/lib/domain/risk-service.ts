import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listRisks(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("risks")
    .select("*, owner:owner_id(first_name, surname, email)")
    .eq("operation_id", operationId)
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

export async function listOperationReadinessChecks(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operation_readiness_checks")
    .select("*, profiles(first_name, surname, email)")
    .eq("operation_id", operationId);
  if (error) throw error;
  return data;
}
