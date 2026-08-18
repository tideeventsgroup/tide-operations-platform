"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline queueing (src/lib/offline) still works without the service
      // worker — this only affects whether the app shell loads offline.
    });
  }, []);

  return null;
}
