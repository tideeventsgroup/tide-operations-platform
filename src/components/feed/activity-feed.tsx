"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Eye, FileSearch, LayoutList, MessageCircle, Rows3, Siren } from "lucide-react";
import { EntityCard } from "@/components/ui/entity-card";
import { EmptyState } from "@/components/empty-state";
import { FeedDenseTable } from "@/components/feed/feed-dense-table";
import { priorityColor, isPriorityCode } from "@/lib/priority-colors";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/domain/feed-service";

type FeedView = "cards" | "dense";
const VIEW_STORAGE_KEY = "sentinel-feed-view";

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
  const [view, setView] = useState<FeedView>("cards");

  // Read the remembered view after mount only, so server-rendered markup
  // (always "cards") matches the first client render and hydration can't
  // mismatch on it.
  useEffect(() => {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "cards" || stored === "dense") setView(stored);
  }, []);

  function selectView(next: FeedView) {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-full border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => selectView("cards")}
            aria-pressed={view === "cards"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              view === "cards" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutList className="size-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => selectView("dense")}
            aria-pressed={view === "dense"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              view === "dense" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Rows3 className="size-3.5" />
            Dense
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState message="Nothing to show" />
      ) : view === "dense" ? (
        <FeedDenseTable items={items} />
      ) : (
        <div className="space-y-3">
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
      )}
    </div>
  );
}
