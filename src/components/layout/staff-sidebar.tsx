"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TideLogo } from "@/components/tide-logo";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string };

// Grows as each phase ships its module — no links to unbuilt routes.
const NAV: NavItem[] = [{ label: "Home", href: "/dashboard" }];

export function StaffSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center px-4">
        <TideLogo variant="dark" height={20} />
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
          <>
            <div className="section-label px-3 pt-4 pb-1 text-sidebar-foreground/50">Administration</div>
            <Link
              href="/admin"
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              Users &amp; Roles
            </Link>
          </>
        ) : null}
      </nav>
    </aside>
  );
}
