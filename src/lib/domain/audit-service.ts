import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listAuditTemplates(organisationId: string, { includeInactive = false }: { includeInactive?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase.from("audit_templates").select("*").eq("organisation_id", organisationId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return data;
}

// Org-wide submission list — /audits. audit_answers is embedded so the
// list can show a real pass/total fraction and flagged (failed) count per
// submission without an N+1 query per row.
export async function listAuditSubmissionsForOrg(organisationId: string, limit = 30) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_submissions")
    .select(
      "*, audit_templates(name), submitted_by_profile:submitted_by(first_name, surname, email), operations(name), audit_answers(response)",
    )
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getAuditTemplate(id: string) {
  const supabase = await createClient();
  const [{ data: template, error: templateErr }, { data: questions, error: questionsErr }] = await Promise.all([
    supabase.from("audit_templates").select("*").eq("id", id).single(),
    supabase.from("audit_template_questions").select("*").eq("template_id", id).order("sort_order"),
  ]);
  if (templateErr) throw templateErr;
  if (questionsErr) throw questionsErr;
  return { template, questions: questions ?? [] };
}

export async function getAuditSubmission(id: string) {
  const supabase = await createClient();
  const { data: submission, error } = await supabase
    .from("audit_submissions")
    .select("*, audit_templates(id, name, description), submitted_by_profile:submitted_by(first_name, surname, email), operations(name)")
    .eq("id", id)
    .single();
  if (error) throw error;

  const [{ data: questions, error: questionsErr }, { data: answers, error: answersErr }] = await Promise.all([
    supabase.from("audit_template_questions").select("*").eq("template_id", submission.audit_templates!.id).order("sort_order"),
    supabase.from("audit_answers").select("*").eq("submission_id", id),
  ]);
  if (questionsErr) throw questionsErr;
  if (answersErr) throw answersErr;

  const answersByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]));

  return { submission, questions: questions ?? [], answersByQuestion };
}
