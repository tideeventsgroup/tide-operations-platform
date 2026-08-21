"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { SentinelWordmark } from "@/components/sentinel-wordmark";
import { GlobalSearchBar } from "@/components/layout/global-search-bar";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { SyncStatusBadge } from "@/components/offline/sync-status-badge";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Home", href: "/dashboard" },
  { label: "Events", href: "/events" },
  { label: "Clients", href: "/clients" },
];

function navItemClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    active ? "bg-black/10 text-white" : "text-white/85 hover:bg-black/5 hover:text-white",
  );
}

export function StaffShell({
  profile,
  isAdmin,
  canViewInvestigations,
  organisationId,
  children,
}: {
  profile: Tables<"profiles">;
  isAdmin: boolean;
  canViewInvestigations: boolean;
  organisationId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const name = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;

  const items = [
    ...NAV,
    ...(canViewInvestigations ? [{ label: "Investigations", href: "/investigations" }] : []),
    ...(isAdmin ? [{ label: "Administration", href: "/admin" }] : []),
  ];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 bg-primary px-4 text-primary-foreground md:gap-6 print:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-white/85 hover:bg-black/5 hover:text-white lg:hidden"
                aria-label="Open menu"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>

          <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar text-sidebar-foreground">
            <SheetHeader>
              <SheetTitle className="text-sidebar-foreground">
                <SentinelWordmark variant="dark" height={18} />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 pb-4">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SheetClose
                    key={item.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      />
                    }
                  >
                    {item.label}
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="shrink-0">
          <SentinelWordmark variant="dark" height={20} />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={navItemClass(active)}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3 lg:flex-none">
          <SyncStatusBadge />
          <ThemeToggle className="text-white/85 hover:bg-black/5 hover:text-white" />
          <span className="hidden text-sm text-white/90 sm:inline">{name}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="text-white/85 hover:bg-black/5 hover:text-white">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <div className="flex h-14 shrink-0 items-center border-b border-border bg-sidebar px-4 print:hidden">
        <GlobalSearchBar organisationId={organisationId} />
      </div>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
