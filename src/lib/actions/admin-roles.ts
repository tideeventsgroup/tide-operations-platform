"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/domain/auth-service";
import type { ActionResult } from "@/lib/actions/admin";

const createRoleSchema = z.object({
  code: z.string().trim().regex(/^[a-z][a-z0-9_]*$/, "Lowercase letters, numbers and underscores only."),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  isExternal: z.coerce.boolean().default(false),
});

export async function createRole(organisationId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = createRoleSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isExternal: formData.get("isExternal") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const supabase = await createClient();
  const { data: roleId, error } = await supabase.rpc("create_role", {
    p_organisation_id: organisationId,
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_is_external: parsed.data.isExternal,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "role",
    p_entity_id: roleId,
    p_action: "created",
    p_after_state: { code: parsed.data.code, name: parsed.data.name, is_external: parsed.data.isExternal },
  });

  revalidatePath("/admin/roles");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateRole(roleId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Enter a role name." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_role", {
    p_role_id: roleId,
    p_name: name,
    // Generated type marks this required (no `?`) since the SQL param has
    // no DEFAULT — the column is nullable and null is a valid runtime value.
    p_description: (description || null) as string,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", { p_entity_type: "role", p_entity_id: roleId, p_action: "updated", p_after_state: { name } });

  revalidatePath("/admin/roles");
  return { success: true };
}

export async function deleteRole(roleId: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_role", { p_role_id: roleId });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", { p_entity_type: "role", p_entity_id: roleId, p_action: "deleted" });

  revalidatePath("/admin/roles");
  revalidatePath("/admin");
  return { success: true };
}

export async function setRolePermission(roleId: string, permissionId: string, enabled: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc(enabled ? "grant_role_permission" : "revoke_role_permission", {
    p_role_id: roleId,
    p_permission_id: permissionId,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "role_permission",
    p_entity_id: roleId,
    p_action: enabled ? "granted" : "revoked",
    p_after_state: { permission_id: permissionId },
  });

  revalidatePath("/admin/roles");
  return { success: true };
}
