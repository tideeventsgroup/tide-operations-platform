import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listInvestigations } from "@/lib/domain/investigation-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InvestigationStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";

function investigatorName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unassigned";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export default async function InvestigationsListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const investigations = await listInvestigations(profile.organisation_id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <PageHeader
        title="Investigations"
        actions={
          <Button render={<Link href="/investigations/new" />} nativeButton={false}>
            New investigation
          </Button>
        }
      />

      {investigations.length === 0 ? (
        <EmptyState message="No investigations yet" />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Ref</DataTableHeadCell>
            <DataTableHeadCell>Case</DataTableHeadCell>
            <DataTableHeadCell>Investigator</DataTableHeadCell>
            <DataTableHeadCell>Linked</DataTableHeadCell>
            <DataTableHeadCell>Status</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {investigations.map((inv) => {
              const links = inv.investigation_events ?? [];
              const opsCount = new Set(links.map((l) => l.events?.operation_id).filter(Boolean)).size;
              return (
                <DataTableRow key={inv.id}>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/investigations/${inv.id}`} className="font-mono text-[11.5px] font-medium text-primary hover:underline">
                      {inv.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/investigations/${inv.id}`} className="font-medium text-foreground hover:underline">
                      {inv.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-foreground">{investigatorName(inv.lead_investigator)}</td>
                  <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                    {links.length} {links.length === 1 ? "record" : "records"} · {opsCount} {opsCount === 1 ? "op" : "ops"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <InvestigationStatusBadge status={inv.status} />
                  </td>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
