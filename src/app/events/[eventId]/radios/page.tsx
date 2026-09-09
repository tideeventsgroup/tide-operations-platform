import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { requireCapability } from "@/modules/identity/internal-auth";
import { RadioRegister } from "./radio-register";

export const dynamic = "force-dynamic";

type Radio = { id: string; unit_number: number; status: "in_store" | "issued" | "faulty" | "lost" };
type Issue = { id: string; radio_id: string; holder_name: string; callsign: string | null; holder_org: string | null; issued_at: string; condition_out: string | null };

export default async function RadiosPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireCapability("radio.read");
  const { eventId } = await params;
  const client = createServiceSupabaseClient();
  const [{ data: event }, { data: radios, error: radiosError }, { data: issues, error: issuesError }] = await Promise.all([
    client.from("events").select("id, name, display_reference, timezone").eq("id", eventId).maybeSingle(),
    client.from("radios").select("id, unit_number, status").order("unit_number").returns<Radio[]>(),
    client.from("radio_issue_records").select("id, radio_id, holder_name, callsign, holder_org, issued_at, condition_out").eq("event_id", eventId).is("returned_at", null).order("issued_at", { ascending: false }).returns<Issue[]>(),
  ]);
  if (!event || radiosError || issuesError) redirect("/access-denied");
  return <RadioRegister event={event} radios={radios ?? []} issues={issues ?? []} />;
}
