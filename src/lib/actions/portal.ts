"use server";

import { createClient } from "@/lib/supabase/server";

// Belt-and-braces re-check (same pattern as the guarded RPCs): even
// though Storage RLS already governs the actual bytes, re-verify the
// document is issued + client/public classified before minting a signed
// URL, rather than trusting only the caller-supplied documentId.
export async function getPortalDocumentDownloadUrlAction(documentId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("status, classification, current_version_id")
    .eq("id", documentId)
    .single();

  if (docError || !document) return { error: "Document not found" };
  if (document.status !== "issued" || !["public", "client"].includes(document.classification)) {
    return { error: "This document is not available in the portal" };
  }
  if (!document.current_version_id) return { error: "No version available" };

  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .select("storage_path")
    .eq("id", document.current_version_id)
    .single();

  if (versionError || !version) return { error: "Version not found" };

  const { data, error } = await supabase.storage.from("event-files").createSignedUrl(version.storage_path, 60 * 5);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
