import { notFound } from "next/navigation";
import { getEvent, listEventLocations } from "@/lib/domain/event-service";
import { listIncidentCategories, listIncidentPriorities } from "@/lib/domain/incident-service";
import { PageHeader } from "@/components/page-header";
import { RapidIncidentForm } from "@/components/incidents/rapid-incident-form";

export default async function NewIncidentPage({ searchParams }: PageProps<"/incidents/new">) {
  const { event: eventId } = await searchParams;
  if (typeof eventId !== "string") notFound();

  let event;
  try {
    event = await getEvent(eventId);
  } catch {
    notFound();
  }

  const [categories, priorities, locations] = await Promise.all([
    listIncidentCategories(),
    listIncidentPriorities(event.organisation_id),
    listEventLocations(eventId),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
      <PageHeader title="Report Incident" description={event.name} />
      <RapidIncidentForm eventId={eventId} categories={categories} priorities={priorities} locations={locations} />
    </div>
  );
}
