import { notFound } from "next/navigation";
import { listOperations } from "@/lib/domain/operation-service";
import { getEventFormContextAction } from "@/lib/actions/operations";
import { listEventCategories } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { ReportEventWizard } from "@/components/events/report-event-wizard";

export default async function NewEventPage({ searchParams }: PageProps<"/events/new">) {
  const { operation: operationId } = await searchParams;

  const categories = await listEventCategories();

  if (typeof operationId === "string") {
    let context;
    try {
      context = await getEventFormContextAction(operationId);
    } catch {
      notFound();
    }
    const { operation, priorities, locations, canViewRestricted } = context;

    return (
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <PageHeader title="Report event" description={operation.name} />
        <ReportEventWizard
          operations={[]}
          categories={categories}
          initialOperation={operation}
          initialPriorities={priorities}
          initialLocations={locations}
          initialCanViewRestricted={canViewRestricted}
        />
      </div>
    );
  }

  const operations = await listOperations();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <PageHeader title="Report event" description="Report a new event against an operation." />
      <ReportEventWizard operations={operations} categories={categories} />
    </div>
  );
}
