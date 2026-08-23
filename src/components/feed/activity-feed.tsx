"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Eye, FileSearch, MessageCircle, Siren } from "lucide-react";
import { EntityCard } from "@/components/ui/entity-card";
import type { FeedItem } from "@/lib/domain/feed-service";

const KIND_FILTER_LABEL: Record<FeedItem["kind"], string> = {
  incident: "Incidents",
  observation: "Observations",
  audit: "Audits",
  investigation: "Investigations",
};

const KIND_ICON: Record<FeedItem["kind"], React.ComponentType<{ className?: string }>> = {
  incident: Siren,
  observation: Eye,
  audit: ClipboardCheck,
  investigation: FileSearch,
};

const KINDS = Object.keys(KIND_FILTER_LABEL) as FeedItem["kind"][];

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
  const [visibleKinds, setVisibleKinds] = useState<Set<FeedItem["kind"]>>(new Set(KINDS));
  const [openOnly, setOpenOnly] = useState(false);

  const filtered = useMemo(
    () => items.filter((item) => visibleKinds.has(item.kind) && (!openOnly || item.isOpen)),
    [items, visibleKinds, openOnly],
  );

  function toggleKind(kind: FeedItem["kind"]) {
    setVisibleKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_240px]">
      <div className="min-w-0 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Nothing to show for the selected filters
          </div>
        ) : (
          filtered.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <EntityCard
                key={item.id}
                href={item.href}
                icon={<Icon className="size-5" />}
                title={item.title}
                reference={item.reference}
                meta={relativeTime(item.timestamp)}
                value={item.value}
                subtitle={item.subtitle}
                subtitleRight={exactDate(item.timestamp)}
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
          })
        )}
      </div>

      <div className="space-y-5">
        <h2 className="text-lg font-bold text-foreground">Show me</h2>
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground">Type</p>
          {KINDS.map((kind) => (
            <label key={kind} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={visibleKinds.has(kind)} onChange={() => toggleKind(kind)} />
              {KIND_FILTER_LABEL[kind]}
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground">Status</p>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
            Open only
          </label>
        </div>
      </div>
    </div>
  );
}
