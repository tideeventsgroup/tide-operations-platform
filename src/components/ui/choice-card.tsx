import { cn } from "@/lib/utils";

// Matched against Auror's attribute-picker cards (Gender/Build/Height in
// their event wizard): a bordered box that fills solid brand-colour when
// selected, rather than a small pill/checkbox. Works for both single-select
// (radio-like) and multi-select (checkbox-like) groups — the difference is
// purely in how the caller manages selection state, not the card itself.
const TONE_SELECTED_CLASS = {
  primary: "border-primary bg-primary text-primary-foreground",
  success: "border-success bg-success text-success-foreground",
  warning: "border-warning bg-warning text-warning-foreground",
  destructive: "border-destructive bg-destructive text-white",
  neutral: "border-foreground bg-foreground text-background",
} as const;

export function ChoiceCard({
  label,
  selected,
  onClick,
  disabled,
  icon,
  tone = "primary",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  tone?: keyof typeof TONE_SELECTED_CLASS;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex min-w-20 flex-col items-center justify-center gap-1.5 rounded-md border p-3 text-center text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        selected ? TONE_SELECTED_CLASS[tone] : "border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
