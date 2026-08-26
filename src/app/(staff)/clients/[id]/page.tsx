import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClient,
  listClientContacts,
  listClientEvents,
  listContactRoleTypes,
} from "@/lib/domain/client-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge, ClientStatusBadge } from "@/components/status-badges";
import { AddContactForm } from "@/components/clients/add-contact-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/ui/entity-card";
import { CalendarDays } from "lucide-react";

export default async function ClientDetailPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;

  let client;
  try {
    client = await getClient(id);
  } catch {
    notFound();
  }

  const [contacts, events, roleTypes] = await Promise.all([
    listClientContacts(id),
    listClientEvents(id),
    listContactRoleTypes(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">{client.reference}</div>
        <div className="flex flex-wrap items-center gap-2">
          <PageHeader title={client.trading_name || client.legal_name} />
          <ClientStatusBadge status={client.status} />
        </div>
        {client.trading_name && <p className="text-sm text-muted-foreground">{client.legal_name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-label">Contacts ({contacts.length})</h2>
            </div>
            {contacts.length === 0 ? (
              <EmptyState message="No contacts yet" />
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {contact.first_name} {contact.surname}
                        {contact.title ? <span className="text-muted-foreground"> · {contact.title}</span> : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {[contact.email, contact.phone].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {contact.client_contact_roles.map((r) => (
                        <Badge key={r.role_code} variant="outline">
                          {r.contact_role_types?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AddContactForm clientId={id} roleTypes={roleTypes} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-label">Events ({events.length})</h2>
              <Button
                render={<Link href={`/operations/new?client=${id}`} />}
                nativeButton={false}
                size="sm"
                variant="outline"
              >
                New event
              </Button>
            </div>
            {events.length === 0 ? (
              <EmptyState message="No events yet" />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <EntityCard
                    key={event.id}
                    href={`/operations/${event.id}`}
                    icon={<CalendarDays className="size-5" />}
                    title={event.name}
                    reference={event.reference}
                    subtitle={event.start_date ? new Date(event.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined}
                    value={<LifecycleStageBadge stage={event.lifecycle_stage} />}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <div className="section-label mb-2">Address</div>
            <p className="text-foreground">
              {[client.address_line1, client.address_line2, client.city, client.postcode]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <div className="section-label mb-2">Billing</div>
            <p className="text-foreground">{client.billing_email || "—"}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <div className="section-label mb-2">Status</div>
            <p className="capitalize text-foreground">{client.status}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
