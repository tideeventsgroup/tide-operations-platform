import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listOrganisationPortalGrants } from "@/lib/domain/admin-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, Pill } from "@/components/ui/data-table";

export default async function PortalAccessPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const grants = await listOrganisationPortalGrants(profile.organisation_id);

  const uniqueUsers = new Set(grants.map((g) => g.user_id)).size;
  const uniqueOperations = new Set(grants.map((g) => g.operation_id).filter(Boolean)).size;
  const portalEnabledOperations = new Set(
    grants.filter((g) => g.operations?.portal_enabled).map((g) => g.operation_id),
  ).size;

  return (
    <>
      <PageHeader title="Portal Access" description="Every external (client-facing) role grant across all operations." />

      <StatTileGroup columns={3}>
        <StatTile label="External users" value={uniqueUsers} />
        <StatTile label="Operations with access granted" value={uniqueOperations} />
        <StatTile label="Operations with portal enabled" value={portalEnabledOperations} />
      </StatTileGroup>

      {grants.length === 0 ? (
        <EmptyState message="No portal access has been granted yet" />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>User</DataTableHeadCell>
            <DataTableHeadCell>Role</DataTableHeadCell>
            <DataTableHeadCell>Operation</DataTableHeadCell>
            <DataTableHeadCell>Portal</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {grants.map((g) => (
              <DataTableRow key={g.id}>
                <DataTableCell
                  primary={[g.profiles?.first_name, g.profiles?.surname].filter(Boolean).join(" ") || g.profiles?.email}
                  secondary={g.profiles?.email}
                />
                <td className="px-4 py-3 align-top">
                  <Pill tone="info">{g.roles?.name}</Pill>
                </td>
                <td className="px-4 py-3 align-top">
                  {g.operations ? (
                    <Link href={`/operations/${g.operations.id}`} className="font-medium text-primary hover:underline">
                      {g.operations.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <Pill tone={g.operations?.portal_enabled ? "success" : "neutral"}>
                    {g.operations?.portal_enabled ? "Enabled" : "Disabled"}
                  </Pill>
                </td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </>
  );
}
