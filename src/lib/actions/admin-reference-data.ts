"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/domain/auth-service";
import type { ActionResult } from "@/lib/actions/admin";

const codeSchema = z.string().trim().min(1).max(64);
const nameSchema = z.string().trim().min(1).max(200);

// record_audit_event.p_entity_id is a required uuid column, but these
// reference tables use text codes as their real key — the code lives in
// before/after_state instead, this is just a synthetic id for the log row.
function randomEntityId() {
  return crypto.randomUUID();
}

// --- Event Categories ---

export async function createEventCategory(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z.object({ code: codeSchema, name: nameSchema, sortOrder: z.coerce.number().int().default(0) }).safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_event_category", {
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "event_category",
    p_entity_id: randomEntityId(),
    p_action: "created",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/event-categories");
  return { success: true };
}

export async function updateEventCategory(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z.object({ code: codeSchema, name: nameSchema, sortOrder: z.coerce.number().int() }).safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_event_category", {
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "event_category",
    p_entity_id: randomEntityId(),
    p_action: "updated",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/event-categories");
  return { success: true };
}

export async function deleteEventCategory(code: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_event_category", { p_code: code });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "event_category",
    p_entity_id: randomEntityId(),
    p_action: "deleted",
    p_before_state: { code },
  });

  revalidatePath("/admin/event-categories");
  return { success: true };
}

// --- Characteristic Types ---

export async function createCharacteristicType(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z.object({ code: codeSchema, name: nameSchema, sortOrder: z.coerce.number().int().default(0) }).safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_characteristic_type", {
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "characteristic_type",
    p_entity_id: randomEntityId(),
    p_action: "created",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/characteristic-types");
  return { success: true };
}

export async function updateCharacteristicType(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z.object({ code: codeSchema, name: nameSchema, sortOrder: z.coerce.number().int() }).safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_characteristic_type", {
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "characteristic_type",
    p_entity_id: randomEntityId(),
    p_action: "updated",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/characteristic-types");
  return { success: true };
}

export async function deleteCharacteristicType(code: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_characteristic_type", { p_code: code });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "characteristic_type",
    p_entity_id: randomEntityId(),
    p_action: "deleted",
    p_before_state: { code },
  });

  revalidatePath("/admin/characteristic-types");
  return { success: true };
}

// --- Event Priorities ---

const priorityFieldsSchema = z.object({
  code: codeSchema,
  name: nameSchema,
  description: z.string().trim().min(1),
  rank: z.coerce.number().int().min(1).max(99),
  colorToken: z.enum(["destructive", "warning", "info", "success", "muted"]),
  targetAckMinutes: z.coerce.number().int().positive().optional().nullable(),
  targetResolveMinutes: z.coerce.number().int().positive().optional().nullable(),
});

function readPriorityFields(formData: FormData) {
  return priorityFieldsSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    rank: formData.get("rank"),
    colorToken: formData.get("colorToken"),
    targetAckMinutes: formData.get("targetAckMinutes") || null,
    targetResolveMinutes: formData.get("targetResolveMinutes") || null,
  });
}

export async function createEventPriority(organisationId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = readPriorityFields(formData);
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_event_priority", {
    p_organisation_id: organisationId,
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_rank: parsed.data.rank,
    p_color_token: parsed.data.colorToken,
    p_target_ack_minutes: parsed.data.targetAckMinutes ?? undefined,
    p_target_resolve_minutes: parsed.data.targetResolveMinutes ?? undefined,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "event_priority",
    p_entity_id: randomEntityId(),
    p_action: "created",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/event-priorities");
  return { success: true };
}

export async function updateEventPriority(organisationId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = readPriorityFields(formData);
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_event_priority", {
    p_organisation_id: organisationId,
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_rank: parsed.data.rank,
    p_color_token: parsed.data.colorToken,
    // Generated types mark these `number` (no `?`) since the SQL param has
    // no DEFAULT — the column itself is nullable and the function accepts
    // a genuine SQL null at runtime, the generator just doesn't express it.
    p_target_ack_minutes: (parsed.data.targetAckMinutes ?? null) as number,
    p_target_resolve_minutes: (parsed.data.targetResolveMinutes ?? null) as number,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "event_priority",
    p_entity_id: randomEntityId(),
    p_action: "updated",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/event-priorities");
  return { success: true };
}

export async function deleteEventPriority(organisationId: string, code: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_event_priority", { p_organisation_id: organisationId, p_code: code });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "event_priority",
    p_entity_id: randomEntityId(),
    p_action: "deleted",
    p_before_state: { code },
  });

  revalidatePath("/admin/event-priorities");
  return { success: true };
}

// --- Control Roles ---

export async function createControlRole(organisationId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z.object({ code: codeSchema, name: nameSchema, sortOrder: z.coerce.number().int().default(0) }).safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_control_role", {
    p_organisation_id: organisationId,
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "control_role",
    p_entity_id: data,
    p_action: "created",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/control-roles");
  return { success: true };
}

export async function updateControlRole(id: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z.object({ name: nameSchema, sortOrder: z.coerce.number().int() }).safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_control_role", { p_id: id, p_name: parsed.data.name, p_sort_order: parsed.data.sortOrder });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "control_role",
    p_entity_id: id,
    p_action: "updated",
    p_after_state: { name: parsed.data.name },
  });

  revalidatePath("/admin/control-roles");
  return { success: true };
}

export async function deleteControlRole(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_control_role", { p_id: id });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", { p_entity_type: "control_role", p_entity_id: id, p_action: "deleted" });

  revalidatePath("/admin/control-roles");
  return { success: true };
}

// --- Document Types ---

export async function createDocumentType(organisationId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z
    .object({ code: codeSchema, name: nameSchema, description: z.string().trim().optional(), sortOrder: z.coerce.number().int().default(0) })
    .safeParse({
      code: formData.get("code"),
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      sortOrder: formData.get("sortOrder") || 0,
    });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_document_type", {
    p_organisation_id: organisationId,
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_description: parsed.data.description ?? undefined,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "document_type",
    p_entity_id: data,
    p_action: "created",
    p_after_state: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/admin/document-types");
  return { success: true };
}

export async function updateDocumentType(id: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const parsed = z
    .object({ name: nameSchema, description: z.string().trim().optional(), sortOrder: z.coerce.number().int() })
    .safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      sortOrder: formData.get("sortOrder"),
    });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_document_type", {
    p_id: id,
    p_name: parsed.data.name,
    // Same generated-type gap as event priorities' target minutes above.
    p_description: (parsed.data.description ?? null) as string,
    p_sort_order: parsed.data.sortOrder,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "document_type",
    p_entity_id: id,
    p_action: "updated",
    p_after_state: { name: parsed.data.name },
  });

  revalidatePath("/admin/document-types");
  return { success: true };
}

export async function deleteDocumentType(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_document_type", { p_id: id });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", { p_entity_type: "document_type", p_entity_id: id, p_action: "deleted" });

  revalidatePath("/admin/document-types");
  return { success: true };
}
