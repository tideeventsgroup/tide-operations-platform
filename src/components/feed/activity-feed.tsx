"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/domain/feed-service";

const KIND_LABEL: Record<FeedItem["kind"], string> = {
  incident: "Incidents",
  observation: "Observations",
  audit: "Audits",
  investigation: "Investigations",
};

const TONE_CLASS: Record<FeedItem["badgeTone"], string> = {
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  muted: "bg-muted text-muted-foreground",
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

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  const kinds = Object.keys(KIND_LABEL) as FeedItem["kind"][];
  const [visibleKinds, setVisibleKinds] = useState<Set<FeedItem["kind"]>>(new Set(kinds));

  const filtered = useMemo(() => items.filter((item) => visibleKinds.has(item.kind)), [items, visibleKinds]);

  function toggle(kind: FeedItem["kind"]) {
    setVisibleKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
      <div className="min-w-0 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Nothing to show for the selected filters
          </div>
        ) : (
          filtered.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block space-y-1.5 rounded-lg border border-border bg-card p-4 text-sm hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground">{item.title}</p>
                <Badge variant="secondary" className={cn("shrink-0 font-medium capitalize", TONE_CLASS[item.badgeTone])}>
                  {item.badge}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {KIND_LABEL[item.kind].replace(/s$/, "")} · {item.subtitle} · {relativeTime(item.timestamp)}
              </p>
            </Link>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="section-label">Show me</h2>
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          {kinds.map((kind) => (
            <label key={kind} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={visibleKinds.has(kind)} onChange={() => toggle(kind)} />
              {KIND_LABEL[kind]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
