"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, MenuIcon, PlusIcon, SettingsIcon } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { SentinelWordmark } from "@/components/sentinel-wordmark";
import { GlobalSearchBar } from "@/components/layout/global-search-bar";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { SyncStatusBadge } from "@/components/offline/sync-status-badge";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Feed", href: "/dashboard" },
  { label: "Search", href: "/search" },
];

const BROWSE: NavItem[] = [
  { label: "Operations", href: "/operations" },
  { label: "Clients", href: "/clients" },
  { label: "People", href: "/people" },
  { label: "Vehicles", href: "/vehicles" },
];

function navItemClass(active: boolean) {
  return cn(
    "rounded-md px-3.5 py-2 text-[15px] font-semibold whitespace-nowrap transition-colors",
    active ? "bg-black/10 text-white" : "text-white/85 hover:bg-black/5 hover:text-white",
  );
}

export function StaffShell({
  profile,
  isAdmin,
  canViewInvestigations,
  canViewInsights,
  canSubmitAudits,
  organisationId,
  children,
}: {
  profile: Tables<"profiles">;
  isAdmin: boolean;
  canViewInvestigations: boolean;
  canViewInsights: boolean;
  canSubmitAudits: boolean;
  organisationId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const name = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;
  const initials = ((profile.first_name?.[0] ?? profile.email[0]) + (profile.surname?.[0] ?? "")).toUpperCase();
  const onSearchPage = pathname.startsWith("/search");

  const browseItems: NavItem[] = [
    ...BROWSE,
    ...(canViewInvestigations ? [{ label: "Investigations", href: "/investigations" }] : []),
    ...(canSubmitAudits ? [{ label: "Audits", href: "/audits" }] : []),
  ];

  const tailItems: NavItem[] = [
    ...(canViewInsights ? [{ label: "Insights", href: "/insights" }] : []),
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  // Flat list for the mobile sheet — a vertical menu has room for every
  // page; the desktop bar keeps Browse as its own dropdown instead.
  const items = [NAV[0], ...browseItems, NAV[1], ...tailItems];

  const createItems = [
    { label: "New operation", href: "/operations/new" },
    { label: "New client", href: "/clients/new" },
    { label: "New person", href: "/people/new" },
    { label: "New vehicle", href: "/vehicles/new" },
    ...(canViewInvestigations ? [{ label: "New investigation", href: "/investigations/new" }] : []),
    ...(canSubmitAudits ? [{ label: "Start an audit", href: "/audits/new" }] : []),
  ];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-[72px] shrink-0 items-center gap-4 bg-sidebar px-4 text-sidebar-foreground md:gap-6 print:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-11 shrink-0 text-white/85 hover:bg-black/5 hover:text-white md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>

          <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground">
            <SheetHeader>
              <SheetTitle className="text-sidebar-foreground">
                <SentinelWordmark variant="dark" height={18} />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 pb-2">
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
                          "flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium transition-colors",
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

            <div className="mt-1 flex flex-col gap-1 border-t border-sidebar-border px-4 pt-3 pb-4">
              <div className="px-3 pb-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-sidebar-foreground/45 uppercase">Create</div>
              {createItems.map((item) => (
                <SheetClose
                  key={item.href}
                  nativeButton={false}
                  render={<Link href={item.href} className="flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground" />}
                >
                  {item.label}
                </SheetClose>
              ))}
            </div>

            <div className="flex flex-col gap-1 border-t border-sidebar-border px-4 pt-3">
              <SheetClose
                nativeButton={false}
                render={<Link href="/settings" className="flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground" />}
              >
                Settings
              </SheetClose>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[15px] font-medium text-sidebar-foreground/80">Appearance</span>
                <ThemeToggle className="text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground" />
              </div>
              <form action={signOut}>
                <button type="submit" className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-[15px] font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground">
                  Sign out
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="shrink-0">
          <SentinelWordmark variant="dark" height={16} />
        </Link>

        <nav className="hidden flex-1 items-center gap-2 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={navItemClass(active)}>
                {item.label}
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1 text-[15px] font-semibold",
                    browseItems.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
                      ? "bg-black/10 text-white"
                      : "text-white/85 hover:bg-black/5 hover:text-white",
                  )}
                />
              }
            >
              Browse
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {browseItems.map((item) => (
                <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {tailItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={navItemClass(active)}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none md:gap-3">
          <Button
            render={<Link href="/events/new" />}
            nativeButton={false}
            aria-label="Report event"
            className="h-9 shrink-0 bg-destructive px-2.5 text-destructive-foreground hover:bg-destructive/90 md:h-7 md:px-2.5"
          >
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Report event</span>
          </Button>

          {/* Everything below is desktop chrome — mobile reaches it via the
              hamburger sheet instead, which has the room for it without
              crowding a 375px-wide header. */}
          <div className="hidden items-center gap-3 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="border-white/25 bg-transparent text-white/85 hover:bg-black/5 hover:text-white" />
                }
              >
                Create
                <ChevronDownIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {createItems.map((item) => (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <SyncStatusBadge />
            <ThemeToggle className="text-white/85 hover:bg-black/5 hover:text-white" />
            <Button
              render={<Link href="/settings" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              aria-label="Settings"
              className="text-white/85 hover:bg-black/5 hover:text-white"
            >
              <SettingsIcon />
            </Button>
            <span className="text-[12.5px] text-white/78">{name}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="text-white/85 hover:bg-black/5 hover:text-white">
                Sign out
              </Button>
            </form>
          </div>

          <div className="flex size-[27px] shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold text-white" style={{ background: "oklch(0.5 0.1 245)" }}>
            {initials}
          </div>
        </div>
      </header>

      {onSearchPage ? null : (
        <div className="flex h-20 shrink-0 items-center justify-center border-b border-border bg-card px-4 print:hidden">
          <GlobalSearchBar organisationId={organisationId} />
        </div>
      )}

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
