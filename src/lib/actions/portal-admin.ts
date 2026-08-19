"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/incidents";

export async function setEventPortalEnabledAction(eventId: string, enabled: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_event_portal_enabled", { p_event_id: eventId, p_enabled: enabled });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function grantEventPortalAccessAction(eventId: string, email: string, roleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_event_portal_access", {
    p_event_id: eventId,
    p_email: email,
    p_role_id: roleId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
