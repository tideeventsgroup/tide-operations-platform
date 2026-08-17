import Link from "next/link";
import { listClients } from "@/lib/domain/client-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
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
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="row-interactive">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <Link href={`/clients/${client.id}`} className="block">
                      {client.reference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="block font-medium text-foreground">
                      {client.trading_name || client.legal_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.city ?? "—"}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{client.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
