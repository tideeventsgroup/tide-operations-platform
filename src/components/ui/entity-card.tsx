import Link from "next/link";
import { cn } from "@/lib/utils";

// Matched against Auror's actual FeedCard DOM (their internal design-system
// classes, shared by the user directly): rounded-2xl card, icon tile, a
// title line of [bold description][blue reference][gray relative time],
// a subtitle line, a right-aligned value/timestamp block, a hairline
// divider, and an optional body section below it. Used everywhere a list
// of records is shown as cards — Feed and a few profile sub-lists.
export function EntityCard({
  href,
  icon,
  title,
  reference,
  meta,
  value,
  subtitle,
  subtitleRight,
  accentColor,
  className,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  title: string;
  reference?: string;
  meta?: string;
  value?: React.ReactNode;
  subtitle?: string;
  subtitleRight?: string;
  /** Optional left-edge accent, e.g. a priority colour. Reserved for
   *  meanings that are worth a permanent visual marker — most cards
   *  should leave this unset. */
  accentColor?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined}
      className={cn(
        "block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 p-5 sm:flex-row">
        <div className="flex min-w-0 flex-1 gap-3">
          {icon ? (
            <div className="hidden h-fit shrink-0 items-center justify-center rounded-md bg-accent p-2 text-primary md:flex">{icon}</div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-base font-semibold text-foreground">{title}</span>
              {reference ? <span className="text-base font-normal text-primary">{reference}</span> : null}
              {meta ? <span className="text-sm font-normal text-muted-foreground">{meta}</span> : null}
            </div>
            {subtitle ? <span className="truncate text-sm text-muted-foreground">{subtitle}</span> : null}
          </div>
        </div>
        {value ? (
          <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start sm:gap-0">
            {typeof value === "string" ? <span className="text-base font-semibold text-foreground capitalize">{value}</span> : value}
            {subtitleRight ? <span className="text-sm text-muted-foreground">{subtitleRight}</span> : null}
          </div>
        ) : null}
      </div>
      {children ? (
        <>
          <div className="h-px w-full bg-border" />
          <div className="p-5 pt-4">{children}</div>
        </>
      ) : null}
    </Link>
  );
}
