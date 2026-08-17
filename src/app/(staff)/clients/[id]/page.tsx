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
import { LifecycleStageBadge } from "@/components/status-badges";
import { AddContactForm } from "@/components/clients/add-contact-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">{client.reference}</div>
        <PageHeader title={client.trading_name || client.legal_name} />
        {client.trading_name && <p className="text-sm text-muted-foreground">{client.legal_name}</p>}
      </div>

      <section className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-2">Address</div>
          <p className="text-foreground">
            {[client.address_line1, client.address_line2, client.city, client.postcode]
              .filter(Boolean)
              .join(", ") || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-2">Billing</div>
          <p className="text-foreground">{client.billing_email || "—"}</p>
        </div>
      </section>

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
            render={<Link href={`/events/new?client=${id}`} />}
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
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="row-interactive flex items-center justify-between px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{event.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{event.reference}</div>
                </div>
                <LifecycleStageBadge stage={event.lifecycle_stage} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
