"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/domain/feed-service";

const KIND_LABEL: Record<FeedItem["kind"], string> = {
  incident: "Incident",
  observation: "Observation",
  audit: "Audit",
  investigation: "Investigation",
};

const KIND_FILTER_LABEL: Record<FeedItem["kind"], string> = {
  incident: "Incidents",
  observation: "Observations",
  audit: "Audits",
  investigation: "Investigations",
};

const TONE_TEXT: Record<FeedItem["badgeTone"], string> = {
  destructive: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
  muted: "text-muted-foreground",
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
  const kinds = Object.keys(KIND_LABEL) as FeedItem["kind"][];
  const [visibleKinds, setVisibleKinds] = useState<Set<FeedItem["kind"]>>(new Set(kinds));
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
      <div className="min-w-0 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Nothing to show for the selected filters
          </div>
        ) : (
          filtered.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-lg border border-border bg-card p-5 hover:border-primary/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-primary">{item.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{relativeTime(item.timestamp)}</span>
                </div>
                <span className={cn("shrink-0 text-lg font-bold capitalize", TONE_TEXT[item.badgeTone])}>{item.badge}</span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-3">
                <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
                <p className="shrink-0 text-xs text-muted-foreground">{exactDate(item.timestamp)}</p>
              </div>

              {item.activity ? (
                <div className="mt-3 flex items-start gap-2 border-t border-border pt-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <MessageCircle className="size-3.5" />
                  </span>
                  <p className="min-w-0 truncate text-sm text-foreground">
                    <span className="font-medium">{item.activity.author}</span>{" "}
                    <span className="text-muted-foreground">{item.activity.body}</span>
                  </p>
                </div>
              ) : null}
            </Link>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="section-label">Show me</h2>
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Type</p>
            {kinds.map((kind) => (
              <label key={kind} className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={visibleKinds.has(kind)} onChange={() => toggleKind(kind)} />
                {KIND_FILTER_LABEL[kind]}
              </label>
            ))}
          </div>
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground">Status</p>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
              Open only
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
