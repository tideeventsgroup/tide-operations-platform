import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { requireCapability } from "@/modules/identity/internal-auth";

export const dynamic = "force-dynamic";

type EventListRecord = {
  display_reference: string;
  id: string;
  name: string;
  starts_at: string;
  timezone: string;
};

export default async function SelectEventPage() {
  await requireCapability("event.read");
  const client = createServiceSupabaseClient();

  const { data: events, error } = await client
    .from("events")
    .select("id, name, display_reference, starts_at, timezone")
    .order("starts_at", { ascending: true })
    .returns<EventListRecord[]>();

  if (error) {
    redirect("/access-denied");
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <strong>Sential</strong>
        <span>Incident Control</span>
      </header>
      <section className="workspace-main" aria-labelledby="event-selection-title">
        <p className="eyebrow">Event context</p>
        <h1 id="event-selection-title">Select an event</h1>
        <p>
          Your live operational view is always scoped to one event. Only events your
          internal role grants access are shown here.
        </p>
        {events && events.length > 0 ? (
          <div className="event-table-wrap">
            <table className="event-table">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Starts</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{event.display_reference}</td>
                    <td>{formatEventTime(event.starts_at, event.timezone)}</td>
                    <td><Link href={`/events/${event.id}/control`}>Open Event Control</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h2>No event access yet</h2>
            <p>There are no events available to your internal role.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function formatEventTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}
