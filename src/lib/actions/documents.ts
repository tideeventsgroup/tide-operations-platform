"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

export async function createDocumentAction(
  eventId: string,
  documentTypeId: string,
  title: string,
  classification: Enums<"classification_level">,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: documentId, error } = await supabase.rpc("create_document", {
    p_event_id: eventId,
    p_document_type_id: documentTypeId,
    p_title: title,
    p_classification: classification,
  });
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}/documents`);
  redirect(`/documents/${documentId}`);
}

export async function uploadDocumentVersionAction(
  documentId: string,
  eventId: string,
  formData: FormData,
): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Select a file to upload." };

  const supabase = await createClient();
  const storagePath = `documents/${eventId}/${documentId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("event-files").upload(storagePath, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return { error: uploadError.message };

  const { error: registerError } = await supabase.rpc("register_document_version", {
    p_document_id: documentId,
    p_storage_path: storagePath,
    p_file_name: file.name,
    p_file_size: file.size,
    p_mime_type: file.type || undefined,
    p_notes: (formData.get("notes") as string) || undefined,
  });
  if (registerError) {
    await supabase.storage.from("event-files").remove([storagePath]);
    return { error: registerError.message };
  }

  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}

export async function getDocumentDownloadUrlAction(storagePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("event-files").createSignedUrl(storagePath, 60 * 5);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

async function callRpc(
  fn: "submit_document_for_review" | "approve_document" | "issue_document" | "archive_document",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  documentId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}

export async function submitDocumentForReviewAction(documentId: string): Promise<ActionResult> {
  return callRpc("submit_document_for_review", { p_document_id: documentId }, documentId);
}

export async function approveDocumentAction(documentId: string, comments?: string): Promise<ActionResult> {
  return callRpc("approve_document", { p_document_id: documentId, p_comments: comments || undefined }, documentId);
}

export async function issueDocumentAction(documentId: string): Promise<ActionResult> {
  return callRpc("issue_document", { p_document_id: documentId }, documentId);
}

export async function archiveDocumentAction(documentId: string, reason: string): Promise<ActionResult> {
  return callRpc("archive_document", { p_document_id: documentId, p_reason: reason }, documentId);
}
