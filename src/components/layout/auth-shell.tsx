import { Radio, ShieldCheck, Siren } from "lucide-react";
import { SentinelWordmark } from "@/components/sentinel-wordmark";

const HIGHLIGHTS = [
  { icon: Siren, text: "Live incident command and control" },
  { icon: ShieldCheck, text: "Governed intelligence, evidence, and investigations" },
  { icon: Radio, text: "A single record of truth across the control room" },
];

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
    <div className="flex min-h-screen">
      <div className="relative hidden w-full max-w-md shrink-0 flex-col justify-between overflow-hidden bg-sidebar px-10 py-12 text-sidebar-foreground lg:flex xl:max-w-lg">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <SentinelWordmark variant="dark" height={26} className="relative" />

        <div className="relative space-y-8">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            Command and control for live events.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-sidebar-foreground/80">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/50">
          &copy; {new Date().getFullYear()} Tide Events Group Scotland
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-6 text-center lg:hidden">
            <SentinelWordmark variant="light" height={36} />
          </div>
          <div className="space-y-1.5 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <div className="surface-elevated rounded-lg border border-border bg-card p-6 sm:p-8">{children}</div>
          {footer ? <div className="text-center text-sm text-muted-foreground lg:text-left">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
