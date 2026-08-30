"use client";

import { useEffect, useState } from "react";
import { SentinelWordmark } from "@/components/sentinel-wordmark";

type Phase = "hidden" | "entering" | "exiting";

const SESSION_KEY = "sentinel-welcome-shown";

// A one-time, personalised welcome sequence played over the dashboard right
// after sign-in — logo, name, status line, then a fade-out reveal of the
// real dashboard underneath. Shown once per browser session (sessionStorage
// gate) so it doesn't replay every time the user clicks back to Feed.
export function WelcomeIntro({ name }: { name: string }) {
  // Captured once, before the effect below ever touches sessionStorage —
  // so React Strict Mode's dev-only mount/cleanup/remount cycle can't make
  // the second effect run see a flag the first run just set and bail out
  // with the overlay stuck on screen (phase never leaves "entering").
  const [shouldPlay] = useState(() => typeof window !== "undefined" && !sessionStorage.getItem(SESSION_KEY));
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (!shouldPlay) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setPhase("entering");

    const exitTimer = setTimeout(() => setPhase("exiting"), 2800);
    const removeTimer = setTimeout(() => setPhase("hidden"), 3400);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [shouldPlay]);

  if (phase === "hidden") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#03162a] transition-all duration-500 ease-in"
      style={phase === "exiting" ? { opacity: 0, transform: "scale(1.03)" } : undefined}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-1/4 -left-1/4 size-[min(70vw,800px)] rounded-full bg-[#60b9c5] opacity-80 blur-2xl"
          style={{ animation: "auth-blob-a 22s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/4 -right-1/4 size-[min(60vw,650px)] rounded-full bg-[#3d8f99] opacity-70 blur-2xl"
          style={{ animation: "auth-blob-b 26s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-1/4 left-1/6 size-[min(55vw,600px)] rounded-full bg-[#0a4d59] opacity-80 blur-2xl"
          style={{ animation: "auth-blob-c 30s ease-in-out infinite" }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-5 text-center">
        <div style={{ animation: "welcome-logo 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          <SentinelWordmark variant="dark" height={30} />
        </div>
        <h1
          className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          style={{ animation: "welcome-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both 0.45s" }}
        >
          Welcome, {name}
        </h1>
        <p
          className="text-sm font-medium tracking-wide text-white/60"
          style={{ animation: "welcome-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both 0.8s" }}
        >
          Control room ready.
        </p>
      </div>
    </div>
  );
}
