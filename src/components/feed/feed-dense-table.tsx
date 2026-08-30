import Link from "next/link";
import { priorityColor, isPriorityCode } from "@/lib/priority-colors";
import { EmptyState } from "@/components/empty-state";
import type { FeedItem } from "@/lib/domain/feed-service";

const KIND_LABEL: Record<FeedItem["kind"], string> = {
  incident: "Event",
  observation: "Observation",
  audit: "Audit",
  investigation: "Investigation",
};

function shortTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// The scan-for-something-you-already-know-happened view: one 44px row per
// item, evidential values (time, ref, priority) in mono, everything else
// in the language face. The card list (ActivityFeed's default) is the
// act-on-the-latest-update view — this is its dense-log counterpart.
export function FeedDenseTable({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return <EmptyState message="Nothing to show for the selected filters" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[64px_84px_1fr_180px_56px] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            <div>Time</div>
            <div>Ref</div>
            <div>Summary</div>
            <div>Latest activity</div>
            <div className="text-right">Pri</div>
          </div>
          {items.map((item) => {
            const hasPriority = isPriorityCode(item.value);
            return (
              <Link
                key={item.id}
                href={item.href}
                style={{ borderLeftColor: hasPriority ? priorityColor(item.value) : "var(--border)" }}
                className="row-interactive grid min-h-11 grid-cols-[64px_84px_1fr_180px_56px] items-center gap-3 border-b border-border/60 border-l-[3px] px-4 py-2 last:border-b-0"
              >
                <span className="font-mono text-xs font-medium text-foreground">{shortTime(item.timestamp)}</span>
                <span className="font-mono text-xs font-medium text-primary">{item.reference}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-muted-foreground uppercase">
                    {KIND_LABEL[item.kind]}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                  {!item.isOpen ? (
                    <span className="shrink-0 rounded bg-success-bg px-1.5 py-0.5 font-mono text-[10px] text-success uppercase">Closed</span>
                  ) : null}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {item.activity ? (
                    <>
                      <span className="font-medium text-foreground">{item.activity.author}:</span> {item.activity.body}
                    </>
                  ) : (
                    item.subtitle
                  )}
                </span>
                <span className="text-right">
                  {hasPriority ? (
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
                      style={{ backgroundColor: priorityColor(item.value) }}
                    >
                      {item.value}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">—</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
