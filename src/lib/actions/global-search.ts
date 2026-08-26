"use server";

import { searchAll } from "@/lib/domain/search-service";
import { getSearchScopes } from "@/lib/domain/search-scopes";

export async function globalSearchAction(organisationId: string, query: string) {
  const scopes = await getSearchScopes(organisationId);
  return searchAll(organisationId, query, scopes);
}
