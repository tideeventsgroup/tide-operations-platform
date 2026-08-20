import { cn } from "@/lib/utils";

export function SentinelWordmark({
  variant,
  height,
  className,
}: {
  variant: "dark" | "light";
  height: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 font-bold tracking-[0.14em]",
        variant === "dark" ? "text-white" : "text-foreground",
        className,
      )}
      style={{ fontSize: height * 0.62, lineHeight: 1 }}
    >
      SENTINEL
      <span className="inline-block rounded-full bg-destructive" style={{ width: height * 0.14, height: height * 0.14 }} />
    </span>
  );
}
