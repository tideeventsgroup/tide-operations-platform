import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string; incidentId: string }> };
type Body = { casualtyReference?: unknown; conditionState?: unknown; careProvider?: unknown; handoverStatus?: unknown; recordingReason?: unknown; idempotencyKey?: unknown };

export async function POST(request: NextRequest, context: RouteContext) {
  const { eventId, incidentId } = await context.params;
  let body: Body;
  try { body = await request.json() as Body; } catch { return invalidRequest(); }
  const client = createServiceSupabaseClient();
  const { data: incident } = await client
    .from("incidents")
    .select("id")
    .eq("id", incidentId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!incident) return notFoundOrDenied();
  const { data, error } = await client.rpc("create_casualty_record", {
    p_incident_id: incidentId,
    p_casualty_reference: value(body.casualtyReference),
    p_condition_state: value(body.conditionState),
    p_care_provider: value(body.careProvider),
    p_handover_status: value(body.handoverStatus),
    p_recording_reason: value(body.recordingReason),
    p_idempotency_key: value(body.idempotencyKey),
  });
  if (!error && Array.isArray(data) && data.length === 1) return NextResponse.json(data[0]);
  const status = error?.code === "42501" ? 403 : error?.code === "23505" ? 409 : 400;
  return NextResponse.json({ error: status === 403 ? "You do not have permission to create a restricted casualty record for this incident." : error?.message ?? "We could not record the casualty coordination details." }, { status });
}

function value(input: unknown): string { return typeof input === "string" ? input : ""; }
function invalidRequest() { return NextResponse.json({ error: "A complete restricted casualty record is required." }, { status: 400 }); }
function notFoundOrDenied() { return NextResponse.json({ error: "This incident is unavailable." }, { status: 403 }); }
