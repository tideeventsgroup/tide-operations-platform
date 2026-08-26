"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/domain/auth-service";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/events";

export async function startAuditSubmissionAction(
  templateId: string,
  operationId?: string,
  locationId?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: submissionId, error } = await supabase.rpc("start_audit_submission", {
    p_template_id: templateId,
    p_operation_id: operationId || undefined,
    p_location_id: locationId || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath("/audits");
  redirect(`/audits/${submissionId}`);
}

export async function answerAuditQuestionAction(
  submissionId: string,
  questionId: string,
  response: Enums<"audit_response">,
  notes?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("answer_audit_question", {
    p_submission_id: submissionId,
    p_question_id: questionId,
    p_response: response,
    p_notes: notes || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath(`/audits/${submissionId}`);
  return { success: true };
}

export async function submitAuditAction(submissionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_audit", { p_submission_id: submissionId });
  if (error) return { error: error.message };
  revalidatePath(`/audits/${submissionId}`);
  revalidatePath("/audits");
  return { success: true };
}

export async function createAuditTemplateAction(organisationId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Enter a template name." };

  const supabase = await createClient();
  const { data: templateId, error } = await supabase.rpc("create_audit_template", {
    p_organisation_id: organisationId,
    p_name: name,
    p_description: description || undefined,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "audit_template",
    p_entity_id: templateId,
    p_action: "created",
    p_after_state: { name },
  });

  revalidatePath("/admin/audit-templates");
  redirect(`/admin/audit-templates/${templateId}`);
}

export async function updateAuditTemplateAction(templateId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Enter a template name." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_audit_template", { p_template_id: templateId, p_name: name, p_description: description });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "audit_template",
    p_entity_id: templateId,
    p_action: "updated",
    p_after_state: { name },
  });

  revalidatePath(`/admin/audit-templates/${templateId}`);
  revalidatePath("/admin/audit-templates");
  return { success: true };
}

export async function setAuditTemplateActiveAction(templateId: string, isActive: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_audit_template_active", { p_template_id: templateId, p_is_active: isActive });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "audit_template",
    p_entity_id: templateId,
    p_action: isActive ? "activated" : "deactivated",
  });

  revalidatePath(`/admin/audit-templates/${templateId}`);
  revalidatePath("/admin/audit-templates");
  return { success: true };
}

export async function deleteAuditTemplateAction(templateId: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_audit_template", { p_template_id: templateId });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", { p_entity_type: "audit_template", p_entity_id: templateId, p_action: "deleted" });

  revalidatePath("/admin/audit-templates");
  return { success: true };
}

export async function addAuditTemplateQuestionAction(templateId: string, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const questionText = String(formData.get("questionText") ?? "").trim();
  const section = String(formData.get("section") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const weight = Number(formData.get("weight") ?? 1);
  if (!questionText) return { error: "Enter the question text." };

  const supabase = await createClient();
  const { data: questionId, error } = await supabase.rpc("add_audit_template_question", {
    p_template_id: templateId,
    p_question_text: questionText,
    p_section: section || undefined,
    p_sort_order: sortOrder,
    p_weight: weight,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "audit_template_question",
    p_entity_id: questionId,
    p_action: "created",
    p_after_state: { question_text: questionText },
  });

  revalidatePath(`/admin/audit-templates/${templateId}`);
  return { success: true };
}

export async function updateAuditTemplateQuestionAction(
  templateId: string,
  questionId: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const questionText = String(formData.get("questionText") ?? "").trim();
  const section = String(formData.get("section") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const weight = Number(formData.get("weight") ?? 1);
  if (!questionText) return { error: "Enter the question text." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_audit_template_question", {
    p_question_id: questionId,
    p_question_text: questionText,
    // Generated type marks this required text (no `?`) since the SQL param
    // has no DEFAULT — the column is nullable and the function accepts a
    // genuine SQL null at runtime, the generator just doesn't express it.
    p_section: (section || null) as string,
    p_sort_order: sortOrder,
    p_weight: weight,
  });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", {
    p_entity_type: "audit_template_question",
    p_entity_id: questionId,
    p_action: "updated",
    p_after_state: { question_text: questionText },
  });

  revalidatePath(`/admin/audit-templates/${templateId}`);
  return { success: true };
}

export async function deleteAuditTemplateQuestionAction(templateId: string, questionId: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_audit_template_question", { p_question_id: questionId });
  if (error) return { error: error.message };

  await supabase.rpc("record_audit_event", { p_entity_type: "audit_template_question", p_entity_id: questionId, p_action: "deleted" });

  revalidatePath(`/admin/audit-templates/${templateId}`);
  return { success: true };
}
