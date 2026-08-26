"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/events";

export async function setOperationPortalEnabledAction(operationId: string, enabled: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_operation_portal_enabled", { p_operation_id: operationId, p_enabled: enabled });
  if (error) return { error: error.message };
  revalidatePath(`/operations/${operationId}`);
  return { success: true };
}

export async function grantOperationPortalAccessAction(operationId: string, email: string, roleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_operation_portal_access", {
    p_operation_id: operationId,
    p_email: email,
    p_role_id: roleId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/operations/${operationId}`);
  return { success: true };
}
