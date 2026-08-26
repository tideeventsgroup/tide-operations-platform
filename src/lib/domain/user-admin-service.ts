import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listOrganisationProfiles(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`organisation_id.eq.${organisationId},account_type.eq.pending`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function listAssignableRoles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("is_external", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listOperationPortalGrants(operationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("*, roles(name, is_external), profiles!user_id(first_name, surname, email)")
    .eq("operation_id", operationId)
    .is("revoked_at", null);

  if (error) throw error;
  return data;
}

export async function listUserRoleGrants(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("*, roles(name, code)")
    .eq("organisation_id", organisationId)
    .is("revoked_at", null);

  if (error) throw error;
  return data;
}
