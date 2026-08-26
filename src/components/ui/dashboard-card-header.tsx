// Matched against Auror's insights dashboard cards: a centered icon above
// a bold title, with a hairline divider beneath separating it from the
// card's content.
export function DashboardCardHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative border-b border-border pt-1 pb-3 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground" />
      <h2 className="mt-1.5 text-base font-semibold text-foreground">{title}</h2>
      {action ? <div className="absolute top-1 right-0 text-sm">{action}</div> : null}
    </div>
  );
}
