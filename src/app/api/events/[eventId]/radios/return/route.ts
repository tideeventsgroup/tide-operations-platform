import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { hasCapability, type InternalRole } from "@/modules/identity/internal-auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  const role = session?.user?.role as InternalRole | undefined;
  if (!session?.user?.id || !role) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!hasCapability(role, "radio.return")) return NextResponse.json({ error: "You do not have permission to return radios." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.issueRecordId !== "string" || typeof body.conditionIn !== "string" || !body.conditionIn.trim()) return NextResponse.json({ error: "Return condition is required." }, { status: 400 });
  const faultFlag = body.faultFlag === true;
  if (faultFlag && (typeof body.faultNotes !== "string" || !body.faultNotes.trim())) return NextResponse.json({ error: "Fault notes are required when a fault is flagged." }, { status: 400 });
  const { data, error } = await createServiceSupabaseClient().rpc("return_radio", {
    p_actor_id: session.user.id, p_issue_record_id: body.issueRecordId, p_condition_in: body.conditionIn,
    p_accessories_in: Array.isArray(body.accessoriesIn) ? body.accessoriesIn.filter((item): item is string => typeof item === "string") : [],
    p_fault_flag: faultFlag, p_fault_notes: typeof body.faultNotes === "string" ? body.faultNotes : "",
  });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This radio issue is no longer open." : "We could not return this radio." }, { status: error.code === "23505" ? 409 : 400 });
  return NextResponse.json(data);
}
