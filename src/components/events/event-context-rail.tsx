import Link from "next/link";
import { splitEventReference } from "@/lib/format-reference";
import { EventWhat3WordsField } from "@/components/events/event-what3words-field";
import type { getEvent, listEvents } from "@/lib/domain/event-service";

type Incident = Awaited<ReturnType<typeof getEvent>>;
type OtherIncident = Awaited<ReturnType<typeof listEvents>>[number];

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <div className="mb-2.5 font-mono text-[9.5px] font-semibold tracking-[0.11em] text-muted-foreground uppercase">{label}</div>
      {children}
    </div>
  );
}

function GlanceRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      {link ? (
        <Link href={link} className="text-right text-[12.5px] font-medium text-primary hover:underline">
          {value}
        </Link>
      ) : (
        <span className="text-right text-[12.5px] font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}

export function EventContextRail({
  incident,
  otherOpenIncidents,
  agenciesCount,
}: {
  incident: Incident;
  otherOpenIncidents: OtherIncident[];
  agenciesCount: number;
}) {
  return (
    <aside className="w-full space-y-3.5 lg:w-[280px]">
      <Panel label="At a glance">
        <div className="space-y-2">
          <GlanceRow label="Location" value={incident.operational_locations?.name ?? "Not specified"} />
          <GlanceRow label="Operation" value={incident.operations?.name ?? "—"} link={`/operations/${incident.operations?.id}`} />
          <GlanceRow
            label="Client"
            value={incident.operations?.clients?.trading_name || incident.operations?.clients?.legal_name || "—"}
          />
          <GlanceRow label="Agencies" value={agenciesCount > 0 ? `${agenciesCount} involved` : "None"} />
          <EventWhat3WordsField eventId={incident.id} what3words={incident.what3words} />
        </div>
      </Panel>

      <Panel label={`Other open events (${otherOpenIncidents.length})`}>
        {otherOpenIncidents.length === 0 ? (
          <p className="text-xs text-muted-foreground">None</p>
        ) : (
          <div className="space-y-2.5">
            {otherOpenIncidents.slice(0, 6).map((other) => {
              const { prefix, number } = splitEventReference(other.reference);
              return (
                <Link key={other.id} href={`/events/${other.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                  <span className="shrink-0 font-mono text-[11px] font-medium text-primary">
                    {prefix}-{number}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">{other.summary}</span>
                </Link>
              );
            })}
          </div>
        )}
        <Link
          href={`/operations/${incident.operations?.id}/events`}
          className="mt-3 block border-t border-border pt-2.5 text-xs font-medium text-primary hover:underline"
        >
          Full event board →
        </Link>
      </Panel>
    </aside>
  );
}
