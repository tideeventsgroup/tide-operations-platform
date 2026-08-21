import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonProfile } from "@/lib/domain/link-analysis-service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ConnectionsDiagram, type ConnectionNode } from "@/components/link-analysis/connections-diagram";

function personName(p: { first_name: string | null; surname: string | null }, fallback: string) {
  return [p.first_name, p.surname].filter(Boolean).join(" ") || fallback;
}

export default async function PersonProfilePage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;

  let profile;
  try {
    profile = await getPersonProfile(id);
  } catch {
    notFound();
  }

  const { person, incidentLinks, investigationLinks } = profile;

  const nodes: ConnectionNode[] = [
    ...incidentLinks
      .filter((link) => link.incidents)
      .map((link) => ({
        id: `incident-${link.incidents!.id}`,
        label: link.incidents!.reference,
        sublabel: link.role_code,
        href: `/incidents/${link.incidents!.id}`,
        kind: "incident" as const,
      })),
    ...investigationLinks
      .filter((link) => link.investigations)
      .map((link) => ({
        id: `investigation-${link.investigations!.id}`,
        label: link.investigations!.reference,
        sublabel: link.role_code,
        href: `/investigations/${link.investigations!.id}`,
        kind: "investigation" as const,
      })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <div className="space-y-2">
        <p className="font-mono text-xs text-muted-foreground">{person.reference}</p>
        <PageHeader title={personName(person, person.reference)} description={person.description ?? undefined} />
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{person.classification}</Badge>
          <Badge variant="secondary" className="capitalize">
            {person.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Purpose: {person.purpose}</p>
      </div>

      <div className="space-y-3">
        <h2 className="section-label">Connections ({nodes.length})</h2>
        <ConnectionsDiagram centerLabel={personName(person, person.reference)} nodes={nodes} />
      </div>

      <div className="space-y-3">
        <h2 className="section-label">Incidents</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {incidentLinks.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No incidents linked</div>
          ) : (
            incidentLinks.map((link) => (
              <Link
                key={link.id}
                href={`/incidents/${link.incidents?.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/50"
              >
                <div>
                  <p className="font-medium text-foreground">{link.incidents?.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.incidents?.reference} · {link.incidents?.events?.name}
                  </p>
                </div>
                <Badge variant="secondary">{link.role_code}</Badge>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="section-label">Investigations</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {investigationLinks.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No investigations linked</div>
          ) : (
            investigationLinks.map((link) => (
              <Link
                key={link.id}
                href={`/investigations/${link.investigations?.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/50"
              >
                <div>
                  <p className="font-medium text-foreground">{link.investigations?.title}</p>
                  <p className="text-xs text-muted-foreground">{link.investigations?.reference}</p>
                </div>
                <Badge variant="secondary">{link.role_code}</Badge>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
