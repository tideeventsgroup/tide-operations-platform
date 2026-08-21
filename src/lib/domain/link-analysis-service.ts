import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getPersonProfile(id: string) {
  const supabase = await createClient();
  const { data: person, error } = await supabase.from("people").select("*").eq("id", id).single();
  if (error) throw error;

  const [{ data: incidentLinks, error: incErr }, { data: investigationLinks, error: invErr }] = await Promise.all([
    supabase
      .from("incident_people")
      .select("*, incidents(id, reference, summary, status, event_id, events(name))")
      .eq("person_id", id)
      .order("linked_at", { ascending: false }),
    supabase
      .from("investigation_people")
      .select("*, investigations(id, reference, title, status)")
      .eq("person_id", id)
      .order("linked_at", { ascending: false }),
  ]);
  if (incErr) throw incErr;
  if (invErr) throw invErr;

  return { person, incidentLinks: incidentLinks ?? [], investigationLinks: investigationLinks ?? [] };
}

export async function getVehicleProfile(id: string) {
  const supabase = await createClient();
  const { data: vehicle, error } = await supabase.from("vehicles").select("*").eq("id", id).single();
  if (error) throw error;

  const [{ data: incidentLinks, error: incErr }, { data: investigationLinks, error: invErr }] = await Promise.all([
    supabase
      .from("incident_vehicles")
      .select("*, incidents(id, reference, summary, status, event_id, events(name))")
      .eq("vehicle_id", id)
      .order("linked_at", { ascending: false }),
    supabase
      .from("investigation_vehicles")
      .select("*, investigations(id, reference, title, status)")
      .eq("vehicle_id", id)
      .order("linked_at", { ascending: false }),
  ]);
  if (incErr) throw incErr;
  if (invErr) throw invErr;

  return { vehicle, incidentLinks: incidentLinks ?? [], investigationLinks: investigationLinks ?? [] };
}
