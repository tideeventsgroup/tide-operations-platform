import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { SentinelWordmark } from "@/components/sentinel-wordmark";
import type { Tables } from "@/lib/supabase/types";

export function PortalHeader({ profile }: { profile: Tables<"profiles"> }) {
  const name = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;
  const initials = ((profile.first_name?.[0] ?? profile.email[0]) + (profile.surname?.[0] ?? "")).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-sidebar px-4 text-sidebar-foreground md:gap-6">
      <Link href="/portal" className="shrink-0">
        <SentinelWordmark variant="dark" height={20} />
      </Link>
      <span className="hidden text-sm font-medium text-sidebar-foreground/80 sm:inline">Client Portal</span>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="flex items-center gap-2.5">
          <span className="hidden text-[12.5px] text-white/78 sm:inline">{name}</span>
          <div className="flex size-[27px] shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold text-white" style={{ background: "oklch(0.5 0.1 245)" }}>
            {initials}
          </div>
        </div>
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
