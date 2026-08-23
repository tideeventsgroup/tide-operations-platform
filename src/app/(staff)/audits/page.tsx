import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { listAuditSubmissions, listAuditTemplates } from "@/lib/domain/audit-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/ui/entity-card";
import { StartAuditForm } from "@/components/audits/start-audit-form";

function scoreColor(score: number | null) {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 90) return "bg-success-bg text-success";
  if (score >= 70) return "bg-warning-bg text-warning";
  return "bg-destructive/10 text-destructive";
}

export default async function AuditsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const canSubmit = await hasPermission("site_audit.submit", { organisationId: profile.organisation_id });
  const canView = await hasPermission("site_audit.view", { organisationId: profile.organisation_id });
  if (!canSubmit && !canView) redirect("/dashboard");

  const [submissions, templates] = await Promise.all([
    listAuditSubmissions(profile.organisation_id),
    listAuditTemplates(profile.organisation_id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader title="Audits" description="Scored compliance walk-throughs, replacing spreadsheet checklists." />

      {canSubmit ? <StartAuditForm templates={templates} /> : null}

      <div className="space-y-3">
        <h2 className="section-label">History</h2>
        {submissions.length === 0 ? (
          <EmptyState message="No audits recorded yet" />
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <EntityCard
                key={s.id}
                href={`/audits/${s.id}`}
                title={s.audit_templates?.name ?? "Audit"}
                value={
                  s.status === "submitted" ? (
                    <Badge variant="secondary" className={scoreColor(s.score)}>
                      {s.score !== null ? `${s.score}%` : "N/A"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )
                }
                subtitle={
                  [[s.submitted_by_profile?.first_name, s.submitted_by_profile?.surname].filter(Boolean).join(" "), s.events?.name]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
                subtitleRight={new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
