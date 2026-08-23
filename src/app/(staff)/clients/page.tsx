import Link from "next/link";
import { listClients } from "@/lib/domain/client-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { EntityCard } from "@/components/ui/entity-card";

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
        <div className="space-y-3">
          {clients.map((client) => (
            <EntityCard
              key={client.id}
              href={`/clients/${client.id}`}
              title={client.trading_name || client.legal_name}
              reference={client.reference}
              value={client.status}
              subtitle={client.city ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
