import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listAuditTemplates } from "@/lib/domain/audit-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CreateAuditTemplateForm } from "@/components/admin/create-audit-template-form";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow, Pill } from "@/components/ui/data-table";

export default async function AuditTemplatesAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const templates = await listAuditTemplates(profile.organisation_id, { includeInactive: true });

  return (
    <>
      <PageHeader title="Audit Templates" description="Scored compliance walk-through templates." />
      <CreateAuditTemplateForm organisationId={profile.organisation_id} />
      {templates.length === 0 ? (
        <EmptyState message="No audit templates yet" />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Template</DataTableHeadCell>
            <DataTableHeadCell>Status</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {templates.map((t) => (
              <DataTableRow key={t.id}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/admin/audit-templates/${t.id}`} className="font-medium text-primary hover:underline">
                    {t.name}
                  </Link>
                  {t.description ? <div className="text-xs text-muted-foreground">{t.description}</div> : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <Pill tone={t.is_active ? "success" : "neutral"}>{t.is_active ? "Active" : "Inactive"}</Pill>
                </td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </>
  );
}
