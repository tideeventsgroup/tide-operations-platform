import { ClipboardCheck, Eye, FileSearch, MessageCircle, Siren } from "lucide-react";
import { EntityCard } from "@/components/ui/entity-card";
import { EmptyState } from "@/components/empty-state";
import { priorityColor, isPriorityCode } from "@/lib/priority-colors";
import type { FeedItem } from "@/lib/domain/feed-service";

const KIND_ICON: Record<FeedItem["kind"], React.ComponentType<{ className?: string }>> = {
  incident: Siren,
  observation: Eye,
  audit: ClipboardCheck,
  investigation: FileSearch,
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function exactDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return <EmptyState message="Nothing to show" />;
  }

  return (
    <div className="min-w-0 space-y-3">
      {items.map((item) => {
        const Icon = KIND_ICON[item.kind];
        const hasPriority = isPriorityCode(item.value);
        return (
          <EntityCard
            key={item.id}
            href={item.href}
            icon={<Icon className="size-5" />}
            title={item.title}
            reference={item.reference}
            meta={relativeTime(item.timestamp)}
            value={
              hasPriority ? (
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-xs font-semibold text-white"
                  style={{ backgroundColor: priorityColor(item.value) }}
                >
                  {item.value}
                </span>
              ) : (
                item.value
              )
            }
            subtitle={item.subtitle}
            subtitleRight={exactDate(item.timestamp)}
            accentColor={hasPriority ? priorityColor(item.value) : undefined}
          >
            {item.activity ? (
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircle className="size-4" />
                </span>
                <p className="min-w-0 text-sm text-foreground">
                  <span className="font-bold">{item.activity.author}</span> {item.activity.body}
                </p>
              </div>
            ) : null}
          </EntityCard>
        );
      })}
    </div>
  );
}
