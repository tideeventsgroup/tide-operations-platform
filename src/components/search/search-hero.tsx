"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

export function SearchHero({ initialQuery, resultCount }: { initialQuery: string; resultCount?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushQuery(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) params.set("q", next.trim());
    else params.delete("q");
    params.delete("n");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function update(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushQuery(next), 300);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushQuery(value);
  }

  return (
    <div className="rounded-xl bg-sidebar p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5 rounded-md border border-white/20 bg-white/10 px-3.5 h-11">
        <SearchIcon className="size-4 shrink-0 text-white/55" />
        <input
          value={value}
          onChange={(e) => update(e.target.value)}
          placeholder="Search operations, events, people, vehicles…"
          autoFocus
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
        />
        {value ? <span className="h-5 w-px shrink-0 bg-primary" /> : null}
        {typeof resultCount === "number" ? (
          <span className="shrink-0 font-mono text-[11.5px] text-white/45">
            {resultCount} {resultCount === 1 ? "RESULT" : "RESULTS"}
          </span>
        ) : null}
      </form>
    </div>
  );
}
