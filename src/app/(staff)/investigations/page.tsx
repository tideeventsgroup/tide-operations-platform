import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listInvestigations } from "@/lib/domain/investigation-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, Pill } from "@/components/ui/data-table";
import { NewInvestigationForm } from "@/components/investigations/new-investigation-form";
import type { Enums } from "@/lib/supabase/types";

const STATUS_TONE: Record<Enums<"investigation_status">, "warning" | "info" | "success" | "neutral"> = {
  open: "warning",
  active: "info",
  closed: "success",
  archived: "neutral",
};

export default async function InvestigationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const investigations = await listInvestigations(profile.organisation_id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader
        title="Investigations"
        description="Case files linking incidents, people, vehicles, and evidence."
      />

      <NewInvestigationForm organisationId={profile.organisation_id} />

      {investigations.length === 0 ? (
        <EmptyState message="No investigations open" />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Reference</DataTableHeadCell>
            <DataTableHeadCell>Investigation</DataTableHeadCell>
            <DataTableHeadCell>Status</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {investigations.map((inv) => (
              <DataTableRow key={inv.id}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/investigations/${inv.id}`} className="font-medium text-primary hover:underline">
                    {inv.reference}
                  </Link>
                </td>
                <DataTableCell
                  primary={inv.title}
                  secondary={
                    inv.lead_investigator
                      ? `Led by ${[inv.lead_investigator.first_name, inv.lead_investigator.surname].filter(Boolean).join(" ")}`
                      : undefined
                  }
                />
                <td className="px-4 py-3 align-top">
                  <Pill tone={STATUS_TONE[inv.status]}>{inv.status}</Pill>
                </td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
