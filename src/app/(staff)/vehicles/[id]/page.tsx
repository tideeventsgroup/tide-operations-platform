import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicleProfile } from "@/lib/domain/link-analysis-service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ConnectionsDiagram, type ConnectionNode } from "@/components/link-analysis/connections-diagram";

function vehicleLabel(v: { registration: string | null; colour: string | null; make: string | null; model: string | null }, fallback: string) {
  return v.registration || [v.colour, v.make, v.model].filter(Boolean).join(" ") || fallback;
}

export default async function VehicleProfilePage({ params }: PageProps<"/vehicles/[id]">) {
  const { id } = await params;

  let profile;
  try {
    profile = await getVehicleProfile(id);
  } catch {
    notFound();
  }

  const { vehicle, incidentLinks, investigationLinks, possibleMatches } = profile;

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
        <p className="font-mono text-xs text-muted-foreground">{vehicle.reference}</p>
        <PageHeader title={vehicleLabel(vehicle, vehicle.reference)} description={vehicle.description ?? undefined} />
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{vehicle.classification}</Badge>
          <Badge variant="secondary" className="capitalize">
            {vehicle.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Purpose: {vehicle.purpose}</p>
      </div>

      <div className="space-y-3">
        <h2 className="section-label">Connections ({nodes.length})</h2>
        <ConnectionsDiagram centerLabel={vehicleLabel(vehicle, vehicle.reference)} nodes={nodes} />
      </div>

      {possibleMatches.length > 0 ? (
        <div className="space-y-3">
          <h2 className="section-label">Possible matches</h2>
          <p className="text-xs text-muted-foreground">
            Other records sharing a registration or make/model/colour. Matching only — nothing is merged automatically;
            confirm and link manually if these are the same vehicle.
          </p>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {possibleMatches.map((match) => (
              <Link
                key={match.id}
                href={`/vehicles/${match.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/50"
              >
                <p className="font-medium text-foreground">{vehicleLabel(match, match.reference)}</p>
                <p className="text-xs text-muted-foreground">{match.reference}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

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
