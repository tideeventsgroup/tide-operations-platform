import { getAllPendingIncidents } from "@/lib/offline/db";

const listeners = new Set<() => void>();
let count = 0;

export function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getSnapshot() {
  return count;
}

export function getServerSnapshot() {
  return 0;
}

export async function refreshPendingCount() {
  const all = await getAllPendingIncidents();
  count = all.length;
  listeners.forEach((listener) => listener());
}
