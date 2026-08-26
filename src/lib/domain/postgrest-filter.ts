// Strips PostgREST filter-syntax characters (,()*) from free text before it
// goes into a `.or()`/`.ilike()` string — those are structural in a filter
// string, not just search text, so raw input (user-typed search terms, or
// free-text record fields like a person's surname) can't be allowed to
// carry them through.
export function sanitizeFilterTerm(value: string) {
  return value.replace(/[,()*]/g, "").trim();
}
