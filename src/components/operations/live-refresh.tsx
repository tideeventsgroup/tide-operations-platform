"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { advanceProbe, isStale, startProbe } from "@/modules/operations/refresh-state";
import styles from "./live-refresh.module.css";

/**
 * Keeps a server-rendered operational screen current without the operator
 * refreshing by hand.
 *
 * This re-runs the page's own server component through router.refresh(), so the
 * existing session, capability check and service-role read all still apply. The
 * browser gains no direct database access, which is deliberate: env.ts keeps
 * Supabase credentials out of browser bundles entirely, so a client-side
 * Realtime subscription would mean shipping a key and opening anon-readable
 * policies.
 *
 * This is polling, not push. New records appear within one interval rather than
 * instantly. Polling pauses while the tab is hidden and resumes on return.
 *
 * Staleness is proven rather than assumed. The page passes the time it rendered
 * on the server, so a completed refresh always delivers a new value. Each cycle
 * counts whether that value advanced; two cycles without movement, or going
 * offline, tells the operator the screen may be out of date instead of leaving
 * them to trust a silent display.
 */
export function LiveRefresh({
  renderedAt,
  intervalMs = 15000,
  label = "record",
}: {
  renderedAt: string;
  intervalMs?: number;
  label?: string;
}) {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [probe, setProbe] = useState(() => startProbe(renderedAt));

  const refresh = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      // Never refresh under an open dialog. React preserves client state across
      // router.refresh(), but an operator part-way through reporting an incident
      // is not a place to rely on that: a half-typed report must not be at risk.
      if (document.querySelector("dialog[open]")) return;
      // Comparing inside the callback keeps all counter work out of render,
      // which the React compiler requires.
      setProbe((current) => advanceProbe(current, renderedAt));
      refresh();
    };

    const onReturn = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onOnline = () => {
      setOffline(false);
      refresh();
    };
    const onOffline = () => setOffline(true);

    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [intervalMs, refresh, renderedAt]);

  const stale = isStale(probe, offline);

  return (
    <p className={styles.status} role="status" aria-live="polite">
      {stale ? (
        <span className={styles.stale}>
          Not updating. This {label} view may be out of date — check your connection.
        </span>
      ) : (
        <span className={styles.live}>Updates automatically every {Math.round(intervalMs / 1000)}s</span>
      )}
      {/* Server and browser may format this differently; the browser's rendering
          is the one the operator reads. */}
      <span className={styles.time} suppressHydrationWarning>
        Updated {new Date(renderedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
      <button className={styles.button} type="button" onClick={refresh}>
        Update now
      </button>
    </p>
  );
}
