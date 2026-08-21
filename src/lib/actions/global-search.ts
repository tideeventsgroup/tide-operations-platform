"use server";

import { globalSearch } from "@/lib/domain/global-search-service";

export async function globalSearchAction(organisationId: string, query: string) {
  return globalSearch(organisationId, query);
}
