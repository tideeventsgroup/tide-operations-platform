import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listClients } from "@/lib/domain/client-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ClientStatusBadge } from "@/components/status-badges";
import { EntityCard } from "@/components/ui/entity-card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default async function ClientsListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const clients = await listClients();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <PageHeader
        title="Clients"
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
          {clients.map((c) => (
            <EntityCard
              key={c.id}
              href={`/clients/${c.id}`}
              icon={<Building2 className="size-5" />}
              title={c.trading_name || c.legal_name}
              reference={c.reference}
              subtitle={c.trading_name ? c.legal_name : undefined}
              value={<ClientStatusBadge status={c.status} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
