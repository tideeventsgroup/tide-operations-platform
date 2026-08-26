"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

export function SearchHero({ initialQuery }: { initialQuery: string }) {
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
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="mb-3 text-2xl font-bold text-foreground">Search SENTINEL</h1>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <SearchIcon className="pointer-events-none absolute left-3 size-5 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => update(e.target.value)}
          placeholder="Find an operation, client, event, person, or vehicle"
          autoFocus
          className="h-12 w-full rounded-lg border border-input bg-transparent pr-24 pl-10 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          className="absolute right-2 rounded-md px-3 py-1.5 text-sm font-semibold text-primary hover:bg-accent"
        >
          Search
        </button>
      </form>
    </div>
  );
}
