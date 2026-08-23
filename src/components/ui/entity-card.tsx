import Link from "next/link";
import { cn } from "@/lib/utils";

// Shared card anatomy matched against Auror's actual feed cards (title +
// reference + value + subtitle + timestamp). Used everywhere a list of
// records is shown — Feed, Events, Clients, Incidents, and the rest —
// instead of each page inventing its own row/list treatment.
export function EntityCard({
  href,
  title,
  reference,
  meta,
  value,
  subtitle,
  subtitleRight,
  className,
  children,
}: {
  href: string;
  title: string;
  reference?: string;
  meta?: string;
  value?: React.ReactNode;
  subtitle?: string;
  subtitleRight?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn("block rounded-lg border border-border bg-card p-5 hover:border-primary/40", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-bold text-foreground">{title}</span>
          {reference ? <span className="ml-1 font-bold text-primary">{reference}</span> : null}
          {meta ? <span className="ml-2 text-xs font-normal text-muted-foreground">{meta}</span> : null}
        </div>
        {value ? (
          typeof value === "string" ? (
            <span className="shrink-0 text-lg font-bold text-foreground capitalize">{value}</span>
          ) : (
            <span className="shrink-0">{value}</span>
          )
        ) : null}
      </div>
      {subtitle || subtitleRight ? (
        <div className="mt-1 flex items-baseline justify-between gap-3">
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : <span />}
          {subtitleRight ? <p className="shrink-0 text-xs text-muted-foreground">{subtitleRight}</p> : null}
        </div>
      ) : null}
      {children}
    </Link>
  );
}
