import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { listAuditSubmissions, listAuditTemplates } from "@/lib/domain/audit-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, Pill } from "@/components/ui/data-table";
import { StartAuditForm } from "@/components/audits/start-audit-form";

function scoreTone(score: number | null): "neutral" | "success" | "warning" | "destructive" {
  if (score === null) return "neutral";
  if (score >= 90) return "success";
  if (score >= 70) return "warning";
  return "destructive";
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
          <DataTable>
            <DataTableHead>
              <DataTableHeadCell>Audit</DataTableHeadCell>
              <DataTableHeadCell>Score</DataTableHeadCell>
              <DataTableHeadCell>Date</DataTableHeadCell>
            </DataTableHead>
            <DataTableBody>
              {submissions.map((s) => (
                <DataTableRow key={s.id}>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/audits/${s.id}`} className="font-medium text-primary hover:underline">
                      {s.audit_templates?.name ?? "Audit"}
                    </Link>
                    {[[s.submitted_by_profile?.first_name, s.submitted_by_profile?.surname].filter(Boolean).join(" "), s.events?.name]
                      .filter(Boolean)
                      .join(" · ") ? (
                      <div className="text-xs text-muted-foreground">
                        {[[s.submitted_by_profile?.first_name, s.submitted_by_profile?.surname].filter(Boolean).join(" "), s.events?.name]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {s.status === "submitted" ? (
                      <Pill tone={scoreTone(s.score)}>{s.score !== null ? `${s.score}%` : "N/A"}</Pill>
                    ) : (
                      <Pill tone="neutral">Draft</Pill>
                    )}
                  </td>
                  <DataTableCell primary={new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
