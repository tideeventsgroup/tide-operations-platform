import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";

type Context = { params: Promise<{ eventId: string; incidentId: string }> };
export async function POST(request: NextRequest, context: Context) {
  const session = await auth(); const { eventId, incidentId } = await context.params;
  if (!session?.user?.id || session.user.role !== "admin") return NextResponse.json({ error: "This action requires an administrator." }, { status: 403 });
  const body = await request.json().catch(() => null) as { password?: string; reference?: string; reason?: string } | null;
  if (!body?.password || !body.reference || !body.reason?.trim()) return NextResponse.json({ error: "Provide your password, the incident reference and an archive reason." }, { status: 400 });
  const client = createServiceSupabaseClient();
  const [{ data: user }, { data: incident }] = await Promise.all([client.from("internal_users").select("password_hash").eq("id", session.user.id).maybeSingle(), client.from("incidents").select("display_reference, archived_at").eq("id", incidentId).eq("event_id", eventId).maybeSingle()]);
  if (!user?.password_hash || !incident || incident.archived_at || incident.display_reference !== body.reference || !(await bcrypt.compare(body.password, user.password_hash))) return NextResponse.json({ error: "Archive confirmation could not be verified." }, { status: 400 });
  const { error } = await client.from("incidents").update({ archived_at: new Date().toISOString(), archived_by: session.user.id, archive_reason: body.reason.trim() }).eq("id", incidentId).eq("event_id", eventId);
  if (error) return NextResponse.json({ error: "We could not archive this incident." }, { status: 500 });
  await client.from("incident_audit_events").insert({ event_id:eventId, incident_id:incidentId, action:"incident.archived", actor_profile_id:session.user.id, details:{ reference:incident.display_reference } });
  return NextResponse.json({ ok:true });
}
