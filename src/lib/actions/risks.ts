"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/events";

async function callRpc(
  fn:
    | "create_risk"
    | "update_risk_status"
    | "update_risk_assessment"
    | "complete_readiness_check"
    | "uncomplete_readiness_check",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  operationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  revalidatePath(`/operations/${operationId}/risk`);
  return { success: true };
}

export async function createRiskAction(
  operationId: string,
  title: string,
  likelihood: number,
  impact: number,
  description?: string,
  category?: string,
): Promise<ActionResult> {
  return callRpc(
    "create_risk",
    {
      p_operation_id: operationId,
      p_title: title,
      p_likelihood: likelihood,
      p_impact: impact,
      p_description: description || undefined,
      p_category: category || undefined,
    },
    operationId,
  );
}

export async function updateRiskStatusAction(
  riskId: string,
  operationId: string,
  status: Enums<"risk_status">,
  note?: string,
): Promise<ActionResult> {
  return callRpc("update_risk_status", { p_risk_id: riskId, p_status: status, p_note: note || undefined }, operationId);
}

export async function completeReadinessCheckAction(operationId: string, checklistItemId: string, notes?: string): Promise<ActionResult> {
  return callRpc(
    "complete_readiness_check",
    { p_operation_id: operationId, p_checklist_item_id: checklistItemId, p_notes: notes || undefined },
    operationId,
  );
}

export async function uncompleteReadinessCheckAction(operationId: string, checklistItemId: string): Promise<ActionResult> {
  return callRpc("uncomplete_readiness_check", { p_operation_id: operationId, p_checklist_item_id: checklistItemId }, operationId);
}
