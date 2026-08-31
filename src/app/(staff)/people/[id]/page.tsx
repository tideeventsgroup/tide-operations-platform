import { notFound } from "next/navigation";
import { getPersonProfile } from "@/lib/domain/link-analysis-service";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/ui/entity-card";
import { EmptyState } from "@/components/empty-state";
import { ConnectionsDiagram, type ConnectionNode } from "@/components/link-analysis/connections-diagram";
import { PersonDescriptionPanel } from "@/components/people/person-description-panel";

function personName(p: { first_name: string | null; surname: string | null }, fallback: string) {
  return [p.first_name, p.surname].filter(Boolean).join(" ") || fallback;
}

function initials(p: { first_name: string | null; surname: string | null }, fallback: string) {
  const a = p.first_name?.[0] ?? fallback[0];
  const b = p.surname?.[0] ?? fallback[1] ?? "";
  return (a + b).toUpperCase();
}

function formatDob(value: string | null) {
  if (!value) return "DOB withheld";
  return `DOB ${new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function formatFirstSeen(value: string) {
  return `first seen ${new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default async function PersonProfilePage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;

  let profile;
  try {
    profile = await getPersonProfile(id);
  } catch {
    notFound();
  }

  const { person, incidentLinks, investigationLinks, possibleMatches } = profile;

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
      <div className="flex items-start gap-5 rounded-lg border border-border bg-card p-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xl font-semibold text-muted-foreground">
          {initials(person, person.reference)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground uppercase">
              {person.purpose}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">{person.reference}</span>
          </div>
          <h1 className="mb-1.5 text-[21px] leading-tight font-semibold tracking-tight text-foreground">{personName(person, person.reference)}</h1>
          <p className="text-[12.5px] text-muted-foreground">
            {formatDob(person.date_of_birth)} · {formatFirstSeen(person.created_at)}
          </p>
          {person.description ? <p className="mt-2 text-sm text-foreground">{person.description}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {person.classification}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {person.status}
            </Badge>
          </div>
        </div>
      </div>

      <PersonDescriptionPanel
        personId={person.id}
        ageGroup={person.age_group}
        gender={person.gender}
        heightBand={person.height_band}
        build={person.build}
        distinguishingFeatures={person.distinguishing_features}
        clothingDescription={person.clothing_description}
      />

      <div className="space-y-3">
        <h2 className="section-label">Connections ({nodes.length})</h2>
        <ConnectionsDiagram centerLabel={personName(person, person.reference)} nodes={nodes} />
      </div>

      {possibleMatches.length > 0 ? (
        <div className="space-y-3">
          <h2 className="section-label">Possible matches</h2>
          <p className="text-xs text-muted-foreground">
            Other records sharing a surname or date of birth. Matching only — nothing is merged automatically; confirm and
            link manually if these are the same person.
          </p>
          <div className="space-y-3">
            {possibleMatches.map((match) => (
              <EntityCard key={match.id} href={`/people/${match.id}`} title={personName(match, match.reference)} reference={match.reference} />
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
