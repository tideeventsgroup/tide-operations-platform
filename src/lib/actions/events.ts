"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createEventRecord } from "@/lib/domain/event-service";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import type { Enums } from "@/lib/supabase/types";

export type ActionResult = { error?: string; success?: boolean };

const eventSchema = z.object({
  client_id: z.string().uuid({ error: "Select a client." }),
  name: z.string().trim().min(1, { error: "Enter an event name." }),
  year: z.coerce.number().int().min(2000).max(2100),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  local_authority: z.string().trim().optional(),
  expected_attendance: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().optional(),
  ),
  licensed_capacity: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().optional(),
  ),
});

export async function createEventAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile?.organisation_id) return { error: "Your account has no organisation." };

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };

  let event;
  try {
    event = await createEventRecord({
      ...parsed.data,
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      organisation_id: profile.organisation_id,
      created_by: profile.id,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create event." };
  }

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function changeEventStageAction(
  eventId: string,
  toStage: Enums<"event_lifecycle_stage">,
  reason?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_event_stage", {
    p_event_id: eventId,
    p_to_stage: toStage,
    p_reason: reason,
  });
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function activateEventAction(eventId: string, comments?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_event", {
    p_event_id: eventId,
    p_comments: comments,
  });
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
