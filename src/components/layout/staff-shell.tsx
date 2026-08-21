"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, FolderSearch, LayoutDashboard, MenuIcon, ShieldCheck } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { SentinelWordmark } from "@/components/sentinel-wordmark";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { SyncStatusBadge } from "@/components/offline/sync-status-badge";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };

const NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Clients", href: "/clients", icon: Building2 },
];

function useNavItems(isAdmin: boolean, canViewInvestigations: boolean): NavItem[] {
  return [
    ...NAV,
    ...(canViewInvestigations ? [{ label: "Investigations", href: "/investigations", icon: FolderSearch }] : []),
    ...(isAdmin ? [{ label: "Administration", href: "/admin", icon: ShieldCheck }] : []),
  ];
}

function navItemClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "border-primary bg-accent text-accent-foreground"
      : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground",
  );
}

export function StaffShell({
  profile,
  isAdmin,
  canViewInvestigations,
  children,
}: {
  profile: Tables<"profiles">;
  isAdmin: boolean;
  canViewInvestigations: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const name = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;
  const items = useNavItems(isAdmin, canViewInvestigations);

  return (
    <div className="flex h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex print:hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
          <Link href="/dashboard">
            <SentinelWordmark variant="light" height={20} />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={navItemClass(active)}>
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-sidebar px-4 text-sidebar-foreground print:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground lg:hidden"
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
                  const Icon = item.icon;
                  return (
                    <SheetClose
                      key={item.href}
                      nativeButton={false}
                      render={
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                          )}
                        />
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="shrink-0 lg:hidden">
            <SentinelWordmark variant="dark" height={18} />
          </Link>

          <div className="flex flex-1 items-center justify-end gap-3">
            <SyncStatusBadge />
            <ThemeToggle className="text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground" />
            <span className="hidden text-sm text-sidebar-foreground/90 sm:inline">{name}</span>
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

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
