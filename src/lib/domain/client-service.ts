import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

export async function listClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("legal_name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getClient(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listClientContacts(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_contacts")
    .select("*, client_contact_roles(role_code, contact_role_types(name))")
    .eq("client_id", clientId)
    .order("surname", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listContactRoleTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contact_role_types").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function listClientEvents(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operations")
    .select("id, reference, name, year, lifecycle_stage, start_date")
    .eq("client_id", clientId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createClientRecord(
  input: Omit<TablesInsert<"clients">, "organisation_id" | "reference"> & { organisation_id: string },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...input, reference: "" }) // trigger overwrites this
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createClientContact(input: TablesInsert<"client_contacts">, roleCodes: string[]) {
  const supabase = await createClient();
  const { data: contact, error } = await supabase.from("client_contacts").insert(input).select().single();
  if (error) throw error;

  if (roleCodes.length > 0) {
    const { error: roleError } = await supabase
      .from("client_contact_roles")
      .insert(roleCodes.map((role_code) => ({ contact_id: contact.id, role_code })));
    if (roleError) throw roleError;
  }

  return contact;
}
