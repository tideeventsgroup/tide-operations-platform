import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string }> };
type Body = { periodId?: unknown; checkpointName?: unknown; status?: unknown; observation?: unknown; idempotencyKey?: unknown };

export async function POST(request: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;
  let body: Body;
  try { body = await request.json() as Body; } catch { return invalidRequest(); }
  const client = createServiceSupabaseClient();
  const { data: period } = await client
    .from("operational_periods")
    .select("id")
    .eq("id", value(body.periodId))
    .eq("event_id", eventId)
    .maybeSingle();
  if (!period) return notFoundOrDenied();
  const { data, error } = await client.rpc("record_perimeter_check", {
    p_operational_period_id: value(body.periodId),
    p_checkpoint_name: value(body.checkpointName),
    p_status: value(body.status),
    p_observation: value(body.observation),
    p_idempotency_key: value(body.idempotencyKey),
  });
  if (!error && Array.isArray(data) && data.length === 1) return NextResponse.json(data[0]);
  const status = error?.code === "42501" ? 403 : error?.code === "23505" ? 409 : 400;
  return NextResponse.json({ error: status === 403 ? "You do not have permission to record a perimeter check for this event." : error?.message ?? "We could not record this perimeter check." }, { status });
}

function value(input: unknown): string { return typeof input === "string" ? input : ""; }
function invalidRequest() { return NextResponse.json({ error: "A complete perimeter check is required." }, { status: 400 }); }
function notFoundOrDenied() { return NextResponse.json({ error: "This operational period is unavailable." }, { status: 403 }); }
