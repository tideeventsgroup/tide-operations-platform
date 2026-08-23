import Link from "next/link";
import { listClients } from "@/lib/domain/client-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, Pill } from "@/components/ui/data-table";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader
        title="Clients"
        description="Client register and reusable contacts."
        actions={
          <Button render={<Link href="/clients/new" />} nativeButton={false}>
            New client
          </Button>
        }
      />

      {clients.length === 0 ? (
        <EmptyState message="No clients yet" />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Reference</DataTableHeadCell>
            <DataTableHeadCell>Client</DataTableHeadCell>
            <DataTableHeadCell>Status</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {clients.map((client) => (
              <DataTableRow key={client.id}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/clients/${client.id}`} className="font-medium text-primary hover:underline">
                    {client.reference}
                  </Link>
                </td>
                <DataTableCell primary={client.trading_name || client.legal_name} secondary={client.city ?? undefined} />
                <td className="px-4 py-3 align-top">
                  <Pill tone={client.status === "active" ? "success" : "neutral"}>{client.status}</Pill>
                </td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
