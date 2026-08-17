import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/types";

export function StaffHeader({ profile }: { profile: Tables<"profiles"> }) {
  const name = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground">{name}</span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
