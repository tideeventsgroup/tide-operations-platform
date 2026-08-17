import Link from "next/link";
import { listEvents } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <PageHeader
        title="Events"
        description="Event lifecycle, from enquiry to archive."
        actions={
          <Button render={<Link href="/events/new" />} nativeButton={false}>
            New event
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState message="No events yet" />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} className="row-interactive">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <Link href={`/events/${event.id}`} className="block">
                      {event.reference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/events/${event.id}`} className="block font-medium text-foreground">
                      {event.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.clients?.trading_name || event.clients?.legal_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString("en-GB") : "—"}
                  </TableCell>
                  <TableCell>
                    <LifecycleStageBadge stage={event.lifecycle_stage} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
