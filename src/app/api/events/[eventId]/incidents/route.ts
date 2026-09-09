import { NextRequest, NextResponse } from "next/server";
import {
  createIncidentCommand,
  InvalidIncidentCommandError,
  type CreateIncidentResult,
} from "@/modules/incidents/create-incident";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { auth } from "@/auth";
import { hasCapability, type InternalRole } from "@/modules/identity/internal-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { eventId } = await context.params;
  const session = await auth();
  const actorId = session?.user?.id;
  const actorRole = session?.user?.role as InternalRole | undefined;

  if (!actorId || !actorRole) {
    return NextResponse.json({ error: "Sign in is required to report an incident." }, { status: 401 });
  }

  if (!hasCapability(actorRole, "incident.create")) {
    return NextResponse.json({ error: "You do not have permission to report an incident for this event." }, { status: 403 });
  }

  const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A JSON incident report is required." }, { status: 400 });
  }

  try {
    const command = createIncidentCommand({
      eventId,
      idempotencyKey,
      categoryId: body.categoryId,
      entryMode: body.entryMode,
      initialReport: body.initialReport,
      locationId: body.locationId,
      occurredAt: body.occurredAt,
      reportSource: body.reportSource,
      severity: body.severity,
      title: body.title,
      zoneId: body.zoneId,
    });
    const client = createServiceSupabaseClient();
    const { data, error } = await client.rpc("create_incident_report", {
      p_actor_id: actorId,
      p_category_id: command.categoryId,
      p_entry_mode: command.entryMode,
      p_event_id: command.eventId,
      p_idempotency_key: command.idempotencyKey,
      p_initial_report: command.initialReport,
      p_location_id: command.locationId,
      p_occurred_at: command.occurredAt,
      p_report_source: command.reportSource,
      p_severity: command.severity,
      p_title: command.title,
      p_zone_id: command.zoneId,
    });

    if (error || !data || data.length !== 1) {
      const status = error?.code === "42501" ? 403 : error?.code === "23505" ? 409 : 500;
      const message = status === 403
        ? "You do not have permission to report an incident for this event."
        : status === 409
          ? "This submission key was already used for a different report."
          : "We could not record the incident. Please retry with the same submission key.";
      return NextResponse.json({ error: message }, { status });
    }

    const result = data[0] as CreateIncidentResult;
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof InvalidIncidentCommandError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "We could not record the incident." }, { status: 500 });
  }
}
