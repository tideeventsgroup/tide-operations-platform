"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (days > 0) return `${days}d ${h}h ${m}m`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function useClock(start: string, end: string | null) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    function tick() {
      const endMs = end ? new Date(end).getTime() : Date.now();
      setSeconds(Math.max(0, Math.floor((endMs - new Date(start).getTime()) / 1000)));
    }
    tick();
    if (end) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [start, end]);
  return seconds;
}

function ClockTile({
  label,
  start,
  end,
  targetMinutes,
}: {
  label: string;
  start: string;
  end: string | null;
  targetMinutes: number | null;
}) {
  const seconds = useClock(start, end);
  const minutes = seconds / 60;

  let colorClass = "text-foreground";
  if (targetMinutes != null) {
    if (minutes >= targetMinutes) colorClass = "text-destructive";
    else if (minutes >= targetMinutes * 0.75) colorClass = "text-warning";
    else colorClass = "text-success";
  }

  return (
    <div className="flex items-baseline justify-between gap-3 sm:block">
      <div className="section-label min-w-0 flex-1 !text-[10px] sm:flex-none sm:!text-[11px]">
        {label}
        {targetMinutes != null ? <span className="ml-1 normal-case text-muted-foreground/70">(target {targetMinutes}m)</span> : null}
      </div>
      <div className={cn("data-value shrink-0 font-mono text-base sm:text-2xl", colorClass)}>{formatDuration(seconds)}</div>
    </div>
  );
}

export function ResponseClocks({
  createdAt,
  acknowledgedAt,
  resolvedAt,
  closedAt,
  targetAckMinutes,
  targetResolveMinutes,
}: {
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  targetAckMinutes: number | null;
  targetResolveMinutes: number | null;
}) {
  const elapsedEnd = closedAt ?? resolvedAt ?? null;

  return (
    <div className="flex w-full flex-col gap-1.5 sm:grid sm:w-auto sm:grid-cols-3 sm:gap-4 sm:text-right">
      <ClockTile label="Elapsed" start={createdAt} end={elapsedEnd} targetMinutes={null} />
      <ClockTile label="To acknowledge" start={createdAt} end={acknowledgedAt} targetMinutes={targetAckMinutes} />
      <ClockTile label="To resolve" start={createdAt} end={resolvedAt} targetMinutes={targetResolveMinutes} />
    </div>
  );
}
