import { notFound } from "next/navigation";
import { getVehicleProfile } from "@/lib/domain/link-analysis-service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/ui/entity-card";
import { EmptyState } from "@/components/empty-state";
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
      .filter((link) => link.events)
      .map((link) => ({
        id: `incident-${link.events!.id}`,
        label: link.events!.reference,
        sublabel: link.role_code,
        href: `/events/${link.events!.id}`,
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
          <div className="space-y-3">
            {possibleMatches.map((match) => (
              <EntityCard key={match.id} href={`/vehicles/${match.id}`} title={vehicleLabel(match, match.reference)} reference={match.reference} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="section-label">Events</h2>
        {incidentLinks.length === 0 ? (
          <EmptyState message="No events linked" />
        ) : (
          <div className="space-y-3">
            {incidentLinks.map((link) => (
              <EntityCard
                key={link.id}
                href={`/events/${link.events?.id}`}
                title={link.events?.summary ?? ""}
                reference={link.events?.reference}
                value={<Badge variant="secondary">{link.role_code}</Badge>}
                subtitle={link.events?.operations?.name ?? undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="section-label">Investigations</h2>
        {investigationLinks.length === 0 ? (
          <EmptyState message="No investigations linked" />
        ) : (
          <div className="space-y-3">
            {investigationLinks.map((link) => (
              <EntityCard
                key={link.id}
                href={`/investigations/${link.investigations?.id}`}
                title={link.investigations?.title ?? ""}
                reference={link.investigations?.reference}
                value={<Badge variant="secondary">{link.role_code}</Badge>}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
