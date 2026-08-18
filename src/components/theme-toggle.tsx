"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  // Matches the server-rendered assumption. The inline script in
  // layout.tsx applies the real theme before paint; useSyncExternalStore
  // automatically re-syncs to the true client value right after hydration
  // (its whole purpose), so no manual "mounted" gate or effect is needed.
  return false;
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage unavailable (private browsing etc.) — theme just won't persist.
    }
    listeners.forEach((listener) => listener());
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={className}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
