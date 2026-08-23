import Link from "next/link";
import { listEvents } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
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
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Reference</DataTableHeadCell>
            <DataTableHeadCell>Event</DataTableHeadCell>
            <DataTableHeadCell>Start date</DataTableHeadCell>
            <DataTableHeadCell>Stage</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {events.map((event) => (
              <DataTableRow key={event.id}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/events/${event.id}`} className="font-medium text-primary hover:underline">
                    {event.reference}
                  </Link>
                </td>
                <DataTableCell primary={event.name} secondary={event.clients?.trading_name || event.clients?.legal_name || undefined} />
                <DataTableCell
                  primary={event.start_date ? new Date(event.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                />
                <td className="px-4 py-3 align-top">
                  <LifecycleStageBadge stage={event.lifecycle_stage} />
                </td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
