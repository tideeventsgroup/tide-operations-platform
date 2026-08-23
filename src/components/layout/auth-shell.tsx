import { SentinelWordmark } from "@/components/sentinel-wordmark";

// Matched against Auror's actual hosted sign-in screen: a full-bleed dark
// backdrop with large soft gradient shapes behind a single centered white
// card (logo, prompt, action) — not a split marketing panel. Colours use
// SENTINEL's own navy/teal palette rather than Auror's yellow.
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03162a] px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-1/4 -left-1/4 size-[min(70vw,800px)] rounded-full bg-[#60b9c5] opacity-80 blur-2xl"
          style={{ animation: "auth-blob-a 22s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/4 -right-1/4 size-[min(60vw,650px)] rounded-full bg-[#3d8f99] opacity-70 blur-2xl"
          style={{ animation: "auth-blob-b 26s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-1/4 left-1/6 size-[min(55vw,600px)] rounded-full bg-[#0a4d59] opacity-80 blur-2xl"
          style={{ animation: "auth-blob-c 30s ease-in-out infinite" }}
        />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <SentinelWordmark variant="dark" height={30} />
        </div>

        <div className="surface-elevated space-y-6 rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {children}
        </div>

        {footer ? <div className="text-center text-sm text-white/70">{footer}</div> : null}
      </div>
    </div>
  );
}
