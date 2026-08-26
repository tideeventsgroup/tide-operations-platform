import "server-only";
import { createClient } from "@/lib/supabase/server";

export type FeedItem = {
  id: string;
  kind: "incident" | "observation" | "audit" | "investigation";
  timestamp: string;
  title: string;
  reference: string;
  subtitle: string;
  href: string;
  value: string;
  isOpen: boolean;
  activity?: { author: string; body: string };
};

// Cross-cutting activity stream — Auror's "Feed" (their landing page).
// Each underlying query is RLS-gated independently, so a viewer without
// e.g. observation.view just gets nothing back for that slice rather
// than an error — same fail-safe pattern as everywhere else in the app.
export async function getActivityFeed(organisationId: string): Promise<FeedItem[]> {
  const supabase = await createClient();

  const [incidentsResult, observationsResult, auditsResult, investigationsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, reference, summary, category_code, priority_code, status, created_at, operations(name), operational_locations(name)")
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("observations")
      .select("id, reference, summary, category, status, created_at, operation_id, operations(name)")
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("audit_submissions")
      .select("id, score, status, submitted_at, created_at, audit_templates(name), operations(name)")
      .eq("organisation_id", organisationId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(30),
    supabase
      .from("investigations")
      .select("id, reference, title, status, opened_at")
      .eq("organisation_id", organisationId)
      .order("opened_at", { ascending: false })
      .limit(30),
  ]);

  const incidents = incidentsResult.data ?? [];

  // One batched query for the latest timeline entry per incident, rather
  // than N+1 — Auror's own feed shows the most recent comment/activity
  // inline on each card, this is the real equivalent rather than a
  // decorative stand-in.
  const latestActivityByIncident = new Map<string, { author: string; body: string }>();
  if (incidents.length > 0) {
    const { data: entries } = await supabase
      .from("event_log_entries")
      .select("event_id, body, created_at, profiles(first_name, surname, email)")
      .in(
        "event_id",
        incidents.map((i) => i.id),
      )
      .order("created_at", { ascending: false });
    for (const entry of entries ?? []) {
      if (latestActivityByIncident.has(entry.event_id)) continue;
      const author = entry.profiles ? [entry.profiles.first_name, entry.profiles.surname].filter(Boolean).join(" ") || entry.profiles.email : "System";
      latestActivityByIncident.set(entry.event_id, { author, body: entry.body });
    }
  }

  const items: FeedItem[] = [];

  for (const i of incidents) {
    items.push({
      id: `incident-${i.id}`,
      kind: "incident",
      timestamp: i.created_at,
      title: i.summary,
      reference: i.reference,
      subtitle: [i.operations?.name, i.operational_locations?.name].filter(Boolean).join(" · "),
      href: `/events/${i.id}`,
      value: i.priority_code ?? i.category_code,
      isOpen: i.status !== "resolved" && i.status !== "closed",
      activity: latestActivityByIncident.get(i.id),
    });
  }

  for (const o of observationsResult.data ?? []) {
    items.push({
      id: `observation-${o.id}`,
      kind: "observation",
      timestamp: o.created_at,
      title: o.summary,
      reference: o.reference,
      subtitle: [o.operations?.name, o.category].filter(Boolean).join(" · "),
      href: `/operations/${o.operation_id}/observations`,
      value: o.status,
      isOpen: o.status === "open",
    });
  }

  for (const a of auditsResult.data ?? []) {
    items.push({
      id: `audit-${a.id}`,
      kind: "audit",
      timestamp: a.submitted_at ?? a.created_at,
      title: a.audit_templates?.name ?? "Audit submitted",
      reference: a.id.slice(0, 8),
      subtitle: a.operations?.name ?? "",
      href: `/audits/${a.id}`,
      value: a.score !== null ? `${a.score}%` : "N/A",
      isOpen: false,
    });
  }

  for (const inv of investigationsResult.data ?? []) {
    items.push({
      id: `investigation-${inv.id}`,
      kind: "investigation",
      timestamp: inv.opened_at,
      title: inv.title,
      reference: inv.reference,
      subtitle: "",
      href: `/investigations/${inv.id}`,
      value: inv.status,
      isOpen: inv.status === "open" || inv.status === "active",
    });
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
}
