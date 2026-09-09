export function retainIdempotencyKey(currentKey: string | null, createKey: () => string): string {
  return currentKey ?? createKey();
}
