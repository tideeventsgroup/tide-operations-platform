import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listAuditLog(
  organisationId: string,
  { entityType, action, limit = 100 }: { entityType?: string; action?: string; limit?: number } = {},
) {
  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("*, profiles!actor_id(first_name, surname, email)")
    .eq("organisation_id", organisationId);
  if (entityType) query = query.eq("entity_type", entityType);
  if (action) query = query.eq("action", action);
  const { data, error } = await query.order("created_at", { ascending: false }).range(0, limit);
  if (error) throw error;
  const rows = data ?? [];
  return { entries: rows.slice(0, limit), hasMore: rows.length > limit };
}

export async function listAuditLogFilters(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("entity_type, action")
    .eq("organisation_id", organisationId);
  if (error) throw error;
  const entityTypes = Array.from(new Set((data ?? []).map((r) => r.entity_type))).sort();
  const actions = Array.from(new Set((data ?? []).map((r) => r.action))).sort();
  return { entityTypes, actions };
}

export async function listPermissions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("permissions").select("*").order("module").order("action");
  if (error) throw error;
  return data ?? [];
}

export async function listRolesWithPermissions(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*, role_permissions(permission_id)")
    .or(`organisation_id.is.null,organisation_id.eq.${organisationId}`)
    .order("is_external")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listOrganisationPortalGrants(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select(
      "*, roles(name, code, is_external), profiles!user_id(first_name, surname, email), operations!operation_id(id, name, reference, portal_enabled)",
    )
    .eq("organisation_id", organisationId)
    .is("revoked_at", null);
  if (error) throw error;
  return (data ?? []).filter((r) => r.roles?.is_external);
}

export async function getOrganisation(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("organisations").select("*").eq("id", organisationId).single();
  if (error) throw error;
  return data;
}
