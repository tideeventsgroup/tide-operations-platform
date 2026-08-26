"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { globalSearchAction } from "@/lib/actions/global-search";
import { Button } from "@/components/ui/button";
import type { SearchEntityType, SearchHit } from "@/lib/domain/search-service";

type Results = Awaited<ReturnType<typeof globalSearchAction>>;

const EMPTY: Results = { operations: [], clients: [], events: [], people: [], vehicles: [], investigations: [], audits: [] };

const GROUP_LABEL: Record<SearchEntityType, string> = {
  operations: "Operations",
  clients: "Clients",
  events: "Events",
  people: "People",
  vehicles: "Vehicles",
  investigations: "Investigations",
  audits: "Audits",
};

const GROUP_ORDER: SearchEntityType[] = ["operations", "events", "clients", "people", "vehicles", "investigations", "audits"];

export function GlobalSearchBar({ organisationId }: { organisationId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function runSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearchAction(organisationId, value);
        setResults(data);
        setOpen(true);
      });
    }, 250);
  }

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
    router.push(href);
  }

  function seeAll() {
    go(`/search?q=${encodeURIComponent(query)}`);
  }

  const hasResults = GROUP_ORDER.some((t) => results[t].length > 0);

  return (
    <div ref={containerRef} className="relative flex w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-background pr-2 pl-4 shadow-sm">
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => runSearch(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim().length >= 2) seeAll();
        }}
        placeholder="Search operations, clients, events, people, vehicles…"
        className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />
      <Button
        variant="ghost"
        className="shrink-0 text-primary hover:bg-transparent hover:underline"
        disabled={pending || query.trim().length < 2}
        onClick={() => setOpen(query.trim().length >= 2)}
      >
        Search
      </Button>

      {open ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card p-2 text-foreground shadow-lg">
          {pending ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : !hasResults ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {GROUP_ORDER.map((type) =>
                results[type].length > 0 ? (
                  <ResultGroup key={type} label={GROUP_LABEL[type]}>
                    {results[type].map((hit) => (
                      <ResultRow key={hit.id} hit={hit} onClick={() => go(hit.href)} />
                    ))}
                  </ResultGroup>
                ) : null,
              )}
            </div>
          )}
          {hasResults ? (
            <button
              type="button"
              onClick={seeAll}
              className="mt-1 block w-full rounded-md px-2 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
            >
              See all results for &ldquo;{query}&rdquo; →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="section-label px-2 pb-1">{label}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultRow({ hit, onClick }: { hit: SearchHit; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
    >
      <span className="font-medium text-foreground">{hit.title}</span>
      {hit.subtitle || hit.reference ? (
        <span className="text-xs text-muted-foreground">{[hit.reference, hit.subtitle].filter(Boolean).join(" · ")}</span>
      ) : null}
    </button>
  );
}
