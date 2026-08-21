"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { globalSearchAction } from "@/lib/actions/global-search";
import { Button } from "@/components/ui/button";

type Results = Awaited<ReturnType<typeof globalSearchAction>>;

const EMPTY: Results = { events: [], clients: [], incidents: [] };

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

  const hasResults = results.events.length > 0 || results.clients.length > 0 || results.incidents.length > 0;

  return (
    <div ref={containerRef} className="relative flex w-full max-w-xl items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-white/50" />
        <input
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search for anything (events, clients, incidents)…"
          className="h-9 w-full rounded-md border border-white/15 bg-white/10 pl-8 pr-3 text-sm text-white placeholder:text-white/50 outline-none focus-visible:border-white/40"
        />
      </div>
      <Button size="sm" className="shrink-0" disabled={pending || query.trim().length < 2} onClick={() => setOpen(query.trim().length >= 2)}>
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
              {results.events.length > 0 ? (
                <ResultGroup label="Events">
                  {results.events.map((e) => (
                    <ResultRow key={e.id} title={e.name} subtitle={e.reference} onClick={() => go(`/events/${e.id}`)} />
                  ))}
                </ResultGroup>
              ) : null}
              {results.incidents.length > 0 ? (
                <ResultGroup label="Incidents">
                  {results.incidents.map((i) => (
                    <ResultRow key={i.id} title={i.summary} subtitle={i.reference} onClick={() => go(`/incidents/${i.id}`)} />
                  ))}
                </ResultGroup>
              ) : null}
              {results.clients.length > 0 ? (
                <ResultGroup label="Clients">
                  {results.clients.map((c) => (
                    <ResultRow
                      key={c.id}
                      title={c.trading_name || c.legal_name}
                      subtitle={c.reference}
                      onClick={() => go(`/clients/${c.id}`)}
                    />
                  ))}
                </ResultGroup>
              ) : null}
            </div>
          )}
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

function ResultRow({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
    >
      <span className="font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </button>
  );
}
