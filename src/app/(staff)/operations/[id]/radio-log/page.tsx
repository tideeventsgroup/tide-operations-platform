import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperation } from "@/lib/domain/operation-service";
import { listRadioLogEntries } from "@/lib/domain/radio-log-service";
import { PageHeader } from "@/components/page-header";
import { LifecycleStageBadge, OperationPhaseBadge } from "@/components/status-badges";
import { RadioLogPanel } from "@/components/radio-log/radio-log-panel";

export default async function EventRadioLogPage({ params }: PageProps<"/operations/[id]/radio-log">) {
  const { id } = await params;

  let event;
  try {
    event = await getOperation(id);
  } catch {
    notFound();
  }

  const entries = await listRadioLogEntries(id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Link href={`/operations/${id}`} className="hover:underline">
            {event.reference}
          </Link>
          <span>·</span>
          <LifecycleStageBadge stage={event.lifecycle_stage} />
          {event.current_phase ? <OperationPhaseBadge phase={event.current_phase} /> : null}
        </div>
        <PageHeader title={`${event.name} — Radio Log`} description="Running log of radio/comms traffic for this event." />
      </div>

      <RadioLogPanel operationId={id} entries={entries} />
    </div>
  );
}
