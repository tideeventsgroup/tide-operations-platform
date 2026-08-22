"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

export async function startAuditSubmissionAction(
  templateId: string,
  eventId?: string,
  locationId?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: submissionId, error } = await supabase.rpc("start_audit_submission", {
    p_template_id: templateId,
    p_event_id: eventId || undefined,
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

export async function createAuditTemplateAction(
  organisationId: string,
  name: string,
  description?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_audit_template", {
    p_organisation_id: organisationId,
    p_name: name,
    p_description: description || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath("/audits");
  return { success: true };
}
