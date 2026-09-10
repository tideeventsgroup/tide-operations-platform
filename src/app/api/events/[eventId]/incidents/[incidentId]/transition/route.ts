import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { auth } from "@/auth";
import { hasCapability, type InternalRole } from "@/modules/identity/internal-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string; incidentId: string }> };
type Body = {
  expectedVersion?: unknown;
  targetStatus?: unknown;
  targetSeverity?: unknown;
  reason?: unknown;
  idempotencyKey?: unknown;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { eventId, incidentId } = await context.params;
  const session = await auth();
  const actorId = session?.user?.id;
  const actorRole = session?.user?.role as InternalRole | undefined;
  if (!actorId || !actorRole) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!hasCapability(actorRole, "incident.manage")) {
    return NextResponse.json({ error: "You do not have permission to transition this incident." }, { status: 403 });
  }

  let body: Body;
  try { body = await request.json() as Body; } catch { return invalidRequest(); }
  if (typeof body.expectedVersion !== "number") return invalidRequest();

  const client = createServiceSupabaseClient();
  const { data: incident } = await client
    .from("incidents")
    .select("id")
    .eq("id", incidentId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!incident) return notFoundOrDenied();

  const { data, error } = await client.rpc("transition_incident", {
    p_actor_id: actorId,
    p_incident_id: incidentId,
    p_expected_version: body.expectedVersion,
    p_target_status: optionalText(body.targetStatus),
    p_target_severity: optionalText(body.targetSeverity),
    p_reason: text(body.reason),
    p_idempotency_key: text(body.idempotencyKey),
  });

  if (!error && Array.isArray(data) && data.length === 1) return NextResponse.json(data[0]);
  const status = error?.code === "42501" ? 403 : error?.code === "40001" || error?.code === "23505" ? 409 : 400;
  const message = status === 403
    ? "You do not have permission to transition this incident."
    : status === 409
      ? "This incident has changed since it was opened. Refresh before trying again."
      : error?.message ?? "We could not record this transition.";
  return NextResponse.json({ error: message }, { status });
}

function text(input: unknown): string { return typeof input === "string" ? input : ""; }
function optionalText(input: unknown): string | null { return typeof input === "string" && input.length > 0 ? input : null; }
function invalidRequest() { return NextResponse.json({ error: "A complete incident transition is required." }, { status: 400 }); }
function notFoundOrDenied() { return NextResponse.json({ error: "This incident is unavailable." }, { status: 403 }); }
