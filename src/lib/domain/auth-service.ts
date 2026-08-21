import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type CurrentProfile = Tables<"profiles">;

/**
 * The signed-in user's profile, or null if unauthenticated. Cached per
 * request so multiple call sites (layout, page, guards) share one lookup.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return profile;
});

export async function isStaff(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_staff");
  return data ?? false;
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  return data ?? false;
}

export async function hasPermission(
  code: string,
  scope?: { organisationId?: string; clientId?: string; eventId?: string },
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("has_permission", {
    p_permission_code: code,
    p_organisation_id: scope?.organisationId,
    p_client_id: scope?.clientId,
    p_event_id: scope?.eventId,
  });
  return data ?? false;
}
