"use client";

import { useEffect, useSyncExternalStore } from "react";
import { WifiOffIcon, RefreshCwIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { flushPendingIncidents } from "@/lib/offline/sync";
import { getSnapshot, getServerSnapshot, refreshPendingCount, subscribe } from "@/lib/offline/pending-store";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

export function SyncStatusBadge() {
  const pendingCount = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);

  useEffect(() => {
    refreshPendingCount();
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    flushPendingIncidents();
    const id = setInterval(() => flushPendingIncidents(), 30000);
    return () => clearInterval(id);
  }, [isOnline]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <Badge
      variant="secondary"
      className={!isOnline ? "gap-1.5 bg-warning-bg text-warning" : "gap-1.5 bg-info-bg text-info"}
    >
      {!isOnline ? <WifiOffIcon className="size-3.5" /> : <RefreshCwIcon className="size-3.5 animate-spin" />}
      {!isOnline
        ? pendingCount > 0
          ? `Offline · ${pendingCount} queued`
          : "Offline"
        : `Syncing ${pendingCount}…`}
    </Badge>
  );
}
