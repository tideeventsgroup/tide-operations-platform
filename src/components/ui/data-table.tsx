import { cn } from "@/lib/utils";

// Matched against Auror's "Footage requests" table: a bordered white card
// wrapping a dense table with gray header labels, two-line cells (bold
// primary + gray secondary), and colored pill badges for status/owner
// columns — the pattern Auror uses for structured operational lists,
// distinct from the card-based Feed.
export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border bg-card", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border">
      <tr>{children}</tr>
    </thead>
  );
}

export function DataTableHeadCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 text-left text-xs font-medium text-muted-foreground", className)}>{children}</th>;
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function DataTableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("hover:bg-muted/40", className)}>{children}</tr>;
}

export function DataTableCell({
  primary,
  secondary,
  className,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-4 py-3 align-top", className)}>
      <div className="font-medium text-foreground">{primary}</div>
      {secondary ? <div className="text-xs text-muted-foreground">{secondary}</div> : null}
    </td>
  );
}

const PILL_TONE = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const;

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof PILL_TONE }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase", PILL_TONE[tone])}>
      {children}
    </span>
  );
}
