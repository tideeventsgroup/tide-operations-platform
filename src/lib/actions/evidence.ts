"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listEvidenceCustodyLog } from "@/lib/domain/evidence-service";
import type { Enums } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/incidents";

export async function listEvidenceCustodyLogAction(evidenceItemId: string) {
  return listEvidenceCustodyLog(evidenceItemId);
}

export async function logEvidenceItemAction(
  incidentId: string,
  eventId: string,
  itemType: string,
  description: string,
  fields: { classification?: Enums<"classification_level">; collectedByName?: string },
  formData?: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  let storagePath: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;
  let sha256Hash: string | undefined;

  const file = formData?.get("file");
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    sha256Hash = createHash("sha256").update(buffer).digest("hex");
    storagePath = `${eventId}/${incidentId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("evidence-files").upload(storagePath, buffer, {
      contentType: file.type || undefined,
    });
    if (uploadError) return { error: uploadError.message };

    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type || undefined;
  }

  const { error } = await supabase.rpc("log_evidence_item", {
    p_incident_id: incidentId,
    p_item_type: itemType,
    p_description: description,
    p_storage_path: storagePath,
    p_file_name: fileName,
    p_file_size: fileSize,
    p_mime_type: mimeType,
    p_sha256_hash: sha256Hash,
    p_classification: fields.classification || undefined,
    p_collected_by_name: fields.collectedByName || undefined,
  });
  if (error) {
    if (storagePath) await supabase.storage.from("evidence-files").remove([storagePath]);
    return { error: error.message };
  }

  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}

export async function getEvidenceDownloadUrlAction(
  evidenceItemId: string,
  storagePath: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { error: accessError } = await supabase.rpc("record_evidence_access", {
    p_evidence_item_id: evidenceItemId,
    p_action: "downloaded",
  });
  if (accessError) return { error: accessError.message };

  const { data, error } = await supabase.storage.from("evidence-files").createSignedUrl(storagePath, 60 * 5);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export async function updateEvidenceStatusAction(
  incidentId: string,
  evidenceItemId: string,
  status: Enums<"evidence_status">,
  notes?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_evidence_status", {
    p_evidence_item_id: evidenceItemId,
    p_status: status,
    p_notes: notes || undefined,
  });
  if (error) return { error: error.message };
  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}
