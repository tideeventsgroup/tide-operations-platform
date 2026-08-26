import "server-only";
import { hasPermission } from "@/lib/domain/auth-service";
import type { SearchScopes } from "@/lib/domain/search-service";

// Operations/Clients/Events are ungated in application code today (RLS
// scopes the rows by organisation) — this preserves that, rather than
// inventing new permission codes nothing else checks.
export async function getSearchScopes(organisationId: string): Promise<SearchScopes> {
  const [intelligenceView, investigationView, siteAuditView, siteAuditSubmit] = await Promise.all([
    hasPermission("intelligence.view", { organisationId }),
    hasPermission("investigation.view", { organisationId }),
    hasPermission("site_audit.view", { organisationId }),
    hasPermission("site_audit.submit", { organisationId }),
  ]);

  return {
    operations: true,
    clients: true,
    events: true,
    people: intelligenceView,
    vehicles: intelligenceView,
    investigations: investigationView,
    audits: siteAuditView || siteAuditSubmit,
  };
}
