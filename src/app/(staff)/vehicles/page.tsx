import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listVehicles } from "@/lib/domain/link-analysis-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";

function vehicleName(v: { registration: string | null; make: string | null; model: string | null; colour: string | null; reference: string }) {
  return v.registration || [v.colour, v.make, v.model].filter(Boolean).join(" ") || v.reference;
}

export default async function VehiclesListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const vehicles = await listVehicles();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <PageHeader
        title="Vehicles"
        description="Intelligence records — linked to events, observations, and investigations."
        actions={
          <Button render={<Link href="/vehicles/new" />} nativeButton={false}>
            New vehicle
          </Button>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState message="No vehicles recorded yet" />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Ref</DataTableHeadCell>
            <DataTableHeadCell>Vehicle</DataTableHeadCell>
            <DataTableHeadCell>Purpose</DataTableHeadCell>
            <DataTableHeadCell>Classification</DataTableHeadCell>
            <DataTableHeadCell>Status</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {vehicles.map((v) => (
              <DataTableRow key={v.id}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/vehicles/${v.id}`} className="font-mono text-[11.5px] font-medium text-primary hover:underline">
                    {v.reference}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">
                  <Link href={`/vehicles/${v.id}`} className="font-mono font-medium text-foreground hover:underline">
                    {vehicleName(v)}
                  </Link>
                  {v.registration ? <div className="text-xs text-muted-foreground">{[v.make, v.model].filter(Boolean).join(" ")}</div> : null}
                </td>
                <td className="px-4 py-3 align-top text-sm text-muted-foreground capitalize">{v.purpose}</td>
                <td className="px-4 py-3 align-top">
                  <Badge variant="secondary" className="capitalize">
                    {v.classification}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge variant="secondary" className="capitalize">
                    {v.status}
                  </Badge>
                </td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
