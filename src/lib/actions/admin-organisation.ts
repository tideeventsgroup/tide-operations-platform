"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/domain/auth-service";
import type { ActionResult } from "@/lib/actions/admin";

const schema = z.object({
  name: z.string().trim().min(1),
  legalName: z.string().trim().min(1),
  status: z.enum(["active", "suspended"]),
});

export async function updateOrganisation(organisationId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = schema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_organisation", {
    p_organisation_id: organisationId,
    p_name: parsed.data.name,
    p_legal_name: parsed.data.legalName,
    p_status: parsed.data.status,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "organisation",
    p_entity_id: organisationId,
    p_action: "updated",
    p_after_state: { name: parsed.data.name, legal_name: parsed.data.legalName, status: parsed.data.status },
  });

  revalidatePath("/admin/organisation");
  return { success: true };
}
