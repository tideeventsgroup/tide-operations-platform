import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { hasCapability, type InternalRole } from "@/modules/identity/internal-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  const role = session?.user?.role as InternalRole | undefined;
  if (!session?.user?.id || !role) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!hasCapability(role, "radio.issue")) return NextResponse.json({ error: "You do not have permission to issue radios." }, { status: 403 });
  const { eventId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.radioId !== "string" || typeof body.holderName !== "string" || !body.holderName.trim()) return NextResponse.json({ error: "Radio and holder name are required." }, { status: 400 });
  const client = createServiceSupabaseClient();
  const { data, error } = await client.rpc("issue_radio", {
    p_actor_id: session.user.id, p_event_id: eventId, p_radio_id: body.radioId,
    p_holder_name: body.holderName, p_callsign: text(body.callsign), p_holder_org: text(body.holderOrg),
    p_condition_out: text(body.conditionOut), p_accessories_out: accessories(body.accessoriesOut),
  });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This radio is no longer available." : "We could not issue this radio." }, { status: error.code === "23505" ? 409 : 400 });
  return NextResponse.json(data, { status: 201 });
}

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function accessories(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
