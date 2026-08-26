"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function AuditLogFilters({ entityTypes, actions }: { entityTypes: string[]; actions: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: "entity" | "action", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("n");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={searchParams.get("entity") ?? ""}
        onChange={(e) => update("entity", e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
      >
        <option value="">All entity types</option>
        {entityTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("action") ?? ""}
        onChange={(e) => update("action", e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
      >
        <option value="">All actions</option>
        {actions.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
