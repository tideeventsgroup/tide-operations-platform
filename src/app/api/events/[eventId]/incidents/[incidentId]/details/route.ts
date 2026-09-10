import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { hasCapability, type InternalRole } from "@/modules/identity/internal-auth";

type Context = { params: Promise<{ eventId: string; incidentId: string }> };
const allowed = new Set(["incident_reporters", "incident_initial_details", "incident_assessments", "incident_operational_impacts", "incident_closures", "incident_resources", "incident_agencies", "incident_people", "incident_evidence", "incident_escalations", "incident_follow_up_actions"]);

export async function PUT(request: NextRequest, context: Context) {
  const { eventId, incidentId } = await context.params; const session = await auth(); const role = session?.user?.role as InternalRole | undefined;
  if (!session?.user?.id || !role) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!hasCapability(role, "incident.manage")) return NextResponse.json({ error: "You do not have permission to update this incident." }, { status: 403 });
  const body = await request.json().catch(() => null) as { table?: string; values?: Record<string, unknown> } | null;
  if (!body?.table || !allowed.has(body.table) || !body.values) return NextResponse.json({ error: "The incident detail section is not recognised." }, { status: 400 });
  const client = createServiceSupabaseClient(); const { data: incident } = await client.from("incidents").select("id").eq("id", incidentId).eq("event_id", eventId).maybeSingle();
  if (!incident) return NextResponse.json({ error: "This incident is not available." }, { status: 404 });
  const values = { ...body.values, incident_id: incidentId, event_id: eventId, updated_at: new Date().toISOString() } as Record<string, unknown>;
  if (body.table === "incident_reporters") values.entered_by = session.user.id;
  if (body.table === "incident_assessments") { values.assessed_by = session.user.id; values.assessed_at = new Date().toISOString(); }
  const childTables = new Set(["incident_resources", "incident_agencies", "incident_people", "incident_evidence", "incident_escalations", "incident_follow_up_actions"]);
  if (childTables.has(body.table)) values.recorded_by = session.user.id;
  const { error } = childTables.has(body.table) ? await client.from(body.table).insert(values) : await client.from(body.table).upsert(values, { onConflict: "incident_id" });
  if (error) return NextResponse.json({ error: "We could not save this section." }, { status: 500 });
  await client.from("incident_audit_events").insert({ event_id: eventId, incident_id: incidentId, action: "incident.detail_saved", actor_profile_id: session.user.id, details: { section: body.table } });
  return NextResponse.json({ ok: true });
}
