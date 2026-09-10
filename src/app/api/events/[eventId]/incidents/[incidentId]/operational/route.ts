import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { hasCapability, type InternalRole } from "@/modules/identity/internal-auth";

type Context = { params: Promise<{ eventId: string; incidentId: string }> };
type Payload = Record<string, unknown> & { command?: unknown; idempotencyKey?: unknown };

export async function POST(request: NextRequest, context: Context) {
  const { eventId, incidentId } = await context.params;
  const session = await auth();
  const role = session?.user?.role as InternalRole | undefined;
  if (!session?.user?.id || !role) return response("Sign in is required.", 401);
  if (!hasCapability(role, "incident.manage")) return response("You do not have permission to manage this incident.", 403);

  const payload = await request.json().catch(() => null) as Payload | null;
  if (!payload || typeof payload.command !== "string" || typeof payload.idempotencyKey !== "string") return response("A complete operational command is required.", 400);

  const client = createServiceSupabaseClient();
  const { data: incident } = await client.from("incidents").select("id").eq("id", incidentId).eq("event_id", eventId).is("archived_at", null).maybeSingle();
  if (!incident) return response("This incident is unavailable.", 404);

  const { data, error } = await runCommand(client, payload, session.user.id, eventId, incidentId);
  if (!error) return NextResponse.json({ ok: true, data });
  const status = error.code === "42501" ? 403 : error.code === "23505" ? 409 : 400;
  return response(status === 409 ? "This request has already been used for different information. Refresh and try again." : error.message, status);
}

async function runCommand(client: ReturnType<typeof createServiceSupabaseClient>, payload: Payload, actorId: string, eventId: string, incidentId: string) {
  const idempotencyKey = payload.idempotencyKey as string;
  if (payload.command === "append") return client.rpc("append_incident_timeline_entry", {
    p_actor_id: actorId, p_event_id: eventId, p_incident_id: incidentId,
    p_entry_type: text(payload.entryType), p_source: text(payload.source), p_content: text(payload.content),
    p_occurred_at: text(payload.occurredAt), p_idempotency_key: idempotencyKey,
  });
  if (payload.command === "create-action") return client.rpc("create_incident_action", {
    p_actor_id: actorId, p_event_id: eventId, p_incident_id: incidentId,
    p_title: text(payload.title), p_owner_name: text(payload.ownerName), p_priority: text(payload.priority),
    p_operational_note: optionalText(payload.operationalNote), p_due_at: optionalText(payload.dueAt), p_idempotency_key: idempotencyKey,
  });
  if (payload.command === "acknowledge-action") return client.rpc("acknowledge_incident_action", {
    p_actor_id: actorId, p_event_id: eventId, p_incident_id: incidentId,
    p_incident_action_id: text(payload.actionId), p_idempotency_key: idempotencyKey,
  });
  if (payload.command === "complete-action" || payload.command === "verify-action") return client.rpc("update_incident_action_status", {
    p_actor_id: actorId, p_event_id: eventId, p_incident_id: incidentId,
    p_incident_action_id: text(payload.actionId), p_target_status: payload.command === "complete-action" ? "completed" : "verified",
    p_note: optionalText(payload.note), p_idempotency_key: idempotencyKey,
  });
  if (payload.command === "record-decision") return client.rpc("record_incident_decision", {
    p_actor_id: actorId, p_event_id: eventId, p_incident_id: incidentId,
    p_decision: text(payload.decision), p_rationale: text(payload.rationale), p_information_available: optionalText(payload.informationAvailable),
    p_decision_maker: text(payload.decisionMaker), p_decided_at: text(payload.decidedAt), p_idempotency_key: idempotencyKey,
  });
  return { data: null, error: { code: "22023", message: "This operational command is not recognised." } };
}

function text(value: unknown): string { return typeof value === "string" ? value : ""; }
function optionalText(value: unknown): string | null { const result = text(value).trim(); return result || null; }
function response(error: string, status: number) { return NextResponse.json({ error }, { status }); }
