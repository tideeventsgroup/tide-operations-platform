import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { auth } from "@/auth";
import { hasCapability, type InternalRole } from "@/modules/identity/internal-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string }> };
type OpenBody = { openingNote?: unknown; idempotencyKey?: unknown };
type CloseBody = {
  closureNote?: unknown;
  expectedVersion?: unknown;
  incidentsReviewed?: unknown;
  actionsReviewed?: unknown;
  logReviewed?: unknown;
  perimeterReviewed?: unknown;
  idempotencyKey?: unknown;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;
  const actor = await requireOperationalActor("period.manage");
  if ("response" in actor) return actor.response;
  const body = await readJson<OpenBody>(request);
  if (!body) return invalidRequest();

  const client = createServiceSupabaseClient();
  const { data, error } = await client.rpc("open_operational_period", {
    p_actor_id: actor.id,
    p_event_id: eventId,
    p_opening_note: text(body.openingNote),
    p_idempotency_key: text(body.idempotencyKey),
  });

  return operationalResponse(data, error, "open");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  await context.params;
  const actor = await requireOperationalActor("period.manage");
  if ("response" in actor) return actor.response;
  const body = await readJson<CloseBody>(request);
  if (!body || typeof body.expectedVersion !== "number") return invalidRequest();

  const client = createServiceSupabaseClient();
  const { data, error } = await client.rpc("close_operational_period", {
    p_actor_id: actor.id,
    p_operational_period_id: request.nextUrl.searchParams.get("periodId") ?? "",
    p_expected_version: body.expectedVersion,
    p_closure_note: text(body.closureNote),
    p_incidents_reviewed: body.incidentsReviewed === true,
    p_actions_reviewed: body.actionsReviewed === true,
    p_log_reviewed: body.logReviewed === true,
    p_perimeter_reviewed: body.perimeterReviewed === true,
    p_idempotency_key: text(body.idempotencyKey),
  });

  return operationalResponse(data, error, "close");
}

async function requireOperationalActor(capability: string): Promise<{ id: string } | { response: NextResponse }> {
  const session = await auth();
  const actorId = session?.user?.id;
  const actorRole = session?.user?.role as InternalRole | undefined;
  if (!actorId || !actorRole) {
    return { response: NextResponse.json({ error: "Sign in is required." }, { status: 401 }) };
  }
  if (!hasCapability(actorRole, capability)) {
    return { response: NextResponse.json({ error: "You do not have permission to perform this command." }, { status: 403 }) };
  }
  return { id: actorId };
}

async function readJson<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function invalidRequest() {
  return NextResponse.json({ error: "A complete operational command is required." }, { status: 400 });
}

function operationalResponse(data: unknown, error: { code?: string; message?: string } | null, action: "open" | "close") {
  if (!error && Array.isArray(data) && data.length === 1) return NextResponse.json(data[0]);
  const status = error?.code === "42501" ? 403 : error?.code === "40001" || error?.code === "23505" ? 409 : 400;
  const errorMessage = status === 403
    ? `You do not have permission to ${action} Event Control for this event.`
    : status === 409
      ? "This operational period has changed. Refresh the command view before trying again."
      : error?.message ?? "We could not record this command.";
  return NextResponse.json({ error: errorMessage }, { status });
}
