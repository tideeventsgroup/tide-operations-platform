"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes Sential installable to a home screen.
 *
 * Registration is best-effort: if it fails the app carries on working normally,
 * because the worker provides installability only and nothing operational
 * depends on it.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Nothing to recover: no operational capability is lost.
      });
    };

    // Wait for load so registration never competes with the first paint of a
    // console an operator is waiting on.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
