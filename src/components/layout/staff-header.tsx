"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { TideLogo } from "@/components/tide-logo";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type NavItem = { label: string; href: string };

// Grows as each phase ships its module — no links to unbuilt routes.
const NAV: NavItem[] = [
  { label: "Home", href: "/dashboard" },
  { label: "Events", href: "/events" },
  { label: "Clients", href: "/clients" },
];

export function StaffHeader({ profile, isAdmin }: { profile: Tables<"profiles">; isAdmin: boolean }) {
  const pathname = usePathname();
  const name = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;

  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-border bg-sidebar px-4 text-sidebar-foreground">
      <Link href="/dashboard" className="shrink-0">
        <TideLogo variant="dark" height={20} />
      </Link>

      <nav className="flex flex-1 items-center gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        {isAdmin ? (
          <Link
            href="/admin"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            Administration
          </Link>
        ) : null}
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm text-sidebar-foreground/90">{name}</span>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
