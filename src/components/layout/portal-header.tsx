import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { TideLogo } from "@/components/tide-logo";
import type { Tables } from "@/lib/supabase/types";

export function PortalHeader({ profile }: { profile: Tables<"profiles"> }) {
  const name = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-sidebar px-4 text-sidebar-foreground md:gap-6">
      <Link href="/portal" className="shrink-0">
        <TideLogo variant="dark" height={20} />
      </Link>
      <span className="hidden text-sm font-medium text-sidebar-foreground/80 sm:inline">Client Portal</span>
      <div className="flex flex-1 items-center justify-end gap-3">
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
  );
}
