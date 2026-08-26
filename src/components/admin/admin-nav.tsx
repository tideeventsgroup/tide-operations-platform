"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "users", label: "Users", href: "/admin" },
  { key: "roles", label: "Roles & Permissions", href: "/admin/roles" },
  { key: "portal", label: "Portal Access", href: "/admin/portal-access" },
  { key: "audit-log", label: "Audit Log", href: "/admin/audit-log" },
  { key: "event-categories", label: "Event Categories", href: "/admin/event-categories" },
  { key: "event-priorities", label: "Event Priorities", href: "/admin/event-priorities" },
  { key: "characteristic-types", label: "Characteristic Types", href: "/admin/characteristic-types" },
  { key: "control-roles", label: "Control Roles", href: "/admin/control-roles" },
  { key: "document-types", label: "Document Types", href: "/admin/document-types" },
  { key: "audit-templates", label: "Audit Templates", href: "/admin/audit-templates" },
  { key: "organisation", label: "Organisation", href: "/admin/organisation" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto border-b border-border">
      {NAV.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "relative shrink-0 px-1 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {isActive ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" /> : null}
          </Link>
        );
      })}
    </div>
  );
}
