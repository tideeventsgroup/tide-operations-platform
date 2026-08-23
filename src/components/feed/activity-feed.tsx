"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { FeedItem } from "@/lib/domain/feed-service";

const KIND_FILTER_LABEL: Record<FeedItem["kind"], string> = {
  incident: "Incidents",
  observation: "Observations",
  audit: "Audits",
  investigation: "Investigations",
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
          filtered.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-lg border border-border bg-card p-5 hover:border-primary/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-foreground">{item.title}</span>{" "}
                  <span className="font-bold text-primary">{item.reference}</span>{" "}
                  <span className="text-xs font-normal text-muted-foreground">{relativeTime(item.timestamp)}</span>
                </div>
                <span className="shrink-0 text-lg font-bold text-foreground capitalize">{item.value}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                {item.subtitle ? <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p> : <span />}
                <p className="shrink-0 text-xs text-muted-foreground">{exactDate(item.timestamp)}</p>
              </div>

              {item.activity ? (
                <div className="mt-3 flex items-start gap-3 border-t border-border pt-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <MessageCircle className="size-4" />
                  </span>
                  <p className="min-w-0 text-sm text-foreground">
                    <span className="font-bold">{item.activity.author}</span> {item.activity.body}
                  </p>
                </div>
              ) : null}
            </Link>
          ))
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
