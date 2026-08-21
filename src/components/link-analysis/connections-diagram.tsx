import Link from "next/link";

type ConnectionNode = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  kind: "incident" | "investigation";
};

const KIND_COLOR: Record<ConnectionNode["kind"], string> = {
  incident: "var(--destructive)",
  investigation: "var(--primary)",
};

// Simple hub-and-spoke SVG: the person/vehicle at the centre, every linked
// incident/investigation arranged around it. Not a force-directed graph —
// deliberately simple, since the value here is "what is this connected
// to," not exploring a large network.
export function ConnectionsDiagram({ centerLabel, nodes }: { centerLabel: string; nodes: ConnectionNode[] }) {
  const width = 640;
  const height = Math.max(320, 140 + nodes.length * 46);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 90;

  const positioned = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2;
    return { ...node, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  if (nodes.length === 0) {
    return <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">No connections yet</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-2">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ minWidth: 480, maxWidth: width }}>
        {positioned.map((node) => (
          <line key={`line-${node.id}`} x1={cx} y1={cy} x2={node.x} y2={node.y} stroke="var(--border)" strokeWidth={1.5} />
        ))}

        <circle cx={cx} cy={cy} r={44} fill="var(--muted)" stroke="var(--foreground)" strokeWidth={1.5} />
        <foreignObject x={cx - 40} y={cy - 40} width={80} height={80}>
          <div className="flex h-full w-full items-center justify-center text-center text-[11px] font-semibold leading-tight text-foreground">
            {centerLabel}
          </div>
        </foreignObject>

        {positioned.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={7} fill={KIND_COLOR[node.kind]} />
            <foreignObject x={node.x - 70} y={node.y + 10} width={140} height={40}>
              <Link href={node.href} className="block text-center text-[11px] leading-tight text-foreground hover:underline">
                <span className="font-medium">{node.label}</span>
                {node.sublabel ? <span className="block text-muted-foreground">{node.sublabel}</span> : null}
              </Link>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}

export type { ConnectionNode };
