import { notFound } from "next/navigation";
import { getAuditSubmission } from "@/lib/domain/audit-service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { AuditSubmissionWorkspace } from "@/components/audits/audit-submission-workspace";

function scoreColor(score: number | null) {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 90) return "bg-success-bg text-success";
  if (score >= 70) return "bg-warning-bg text-warning";
  return "bg-destructive/10 text-destructive";
}

export default async function AuditSubmissionPage({ params }: PageProps<"/audits/[id]">) {
  const { id } = await params;

  let data;
  try {
    data = await getAuditSubmission(id);
  } catch {
    notFound();
  }

  const { submission, questions, answersByQuestion } = data;
  const isDraft = submission.status === "draft";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <div className="space-y-2">
        <PageHeader title={submission.audit_templates?.name ?? "Audit"} description={submission.audit_templates?.description ?? undefined} />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {[submission.submitted_by_profile?.first_name, submission.submitted_by_profile?.surname].filter(Boolean).join(" ")}
          </span>
          {submission.events?.name ? <span>· {submission.events.name}</span> : null}
          {isDraft ? (
            <Badge variant="secondary">In progress</Badge>
          ) : (
            <Badge variant="secondary" className={scoreColor(submission.score)}>
              {submission.score !== null ? `${submission.score}% overall` : "N/A"}
            </Badge>
          )}
        </div>
      </div>

      <AuditSubmissionWorkspace submissionId={id} questions={questions} initialAnswers={answersByQuestion} isDraft={isDraft} />
    </div>
  );
}
