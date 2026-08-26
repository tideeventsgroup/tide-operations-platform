// Matched against Auror's "Hot categories" bar chart: a horizontal bar per
// row sized relative to the largest value, label left, count right.
export function BarList({ items }: { items: { key: string; label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-foreground">{item.label}</span>
            <span className="data-value shrink-0">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
