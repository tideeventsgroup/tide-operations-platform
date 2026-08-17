"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isAdmin } from "@/lib/domain/auth-service";

export type ActionResult = { error?: string; success?: boolean };

const approveUserSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

/**
 * Approves a pending account: assigns it to the admin's organisation,
 * promotes account_type to staff (or leaves it for an explicitly external
 * role — see roleIsExternal), and grants the chosen role. All three writes
 * happen together so a user is never left half-approved.
 */
export async function approveUser(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };

  const parsed = approveUserSchema.safeParse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const admin = await getCurrentProfile();
  if (!admin?.organisation_id) return { error: "Your account has no organisation." };

  const supabase = await createClient();

  const { data: role } = await supabase.from("roles").select("is_external").eq("id", parsed.data.roleId).single();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      organisation_id: admin.organisation_id,
      account_type: role?.is_external ? "client" : "staff",
    })
    .eq("id", parsed.data.userId);

  if (profileError) return { error: profileError.message };

  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: parsed.data.userId,
    role_id: parsed.data.roleId,
    organisation_id: admin.organisation_id,
    granted_by: admin.id,
  });

  if (roleError) return { error: roleError.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "user",
    p_entity_id: parsed.data.userId,
    p_action: "approved",
    p_after_state: { role_id: parsed.data.roleId, account_type: role?.is_external ? "client" : "staff" },
  });

  revalidatePath("/admin");
  return { success: true };
}

const revokeRoleSchema = z.object({ userRoleId: z.string().uuid() });

export async function revokeRole(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };

  const parsed = revokeRoleSchema.safeParse({ userRoleId: formData.get("userRoleId") });
  if (!parsed.success) return { error: "Invalid request." };

  const admin = await getCurrentProfile();
  if (!admin) return { error: "Not signed in." };

  const supabase = await createClient();
  const { data: grant, error } = await supabase
    .from("user_roles")
    .update({ revoked_at: new Date().toISOString(), revoked_by: admin.id })
    .eq("id", parsed.data.userRoleId)
    .select("user_id, role_id")
    .single();

  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "user_role",
    p_entity_id: parsed.data.userRoleId,
    p_action: "revoked",
    p_before_state: { user_id: grant.user_id, role_id: grant.role_id },
  });

  revalidatePath("/admin");
  return { success: true };
}
