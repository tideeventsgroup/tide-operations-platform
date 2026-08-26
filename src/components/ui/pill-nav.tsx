import Link from "next/link";
import { cn } from "@/lib/utils";

// Matched against Auror's rounded pill sub-navigation (the Profile-Feed
// filter row and the search category selector): a horizontal row of
// rounded-full links, filled/bordered when active, muted otherwise.
export function PillNav({ items }: { items: { href: string; label: string; active?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
            item.active
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
