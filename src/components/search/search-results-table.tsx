"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  DataTableSortableHeadCell,
} from "@/components/ui/data-table";
import {
  AuditScoreBadge,
  ClientStatusBadge,
  EventStatusBadge,
  InvestigationStatusBadge,
  LifecycleStageBadge,
} from "@/components/status-badges";
import type { SearchHit } from "@/lib/domain/search-service";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function renderBadge(badge: SearchHit["badge"]) {
  if (!badge) return null;
  switch (badge.kind) {
    case "operationStage":
      return <LifecycleStageBadge stage={badge.value} />;
    case "eventStatus":
      return <EventStatusBadge status={badge.value} />;
    case "clientStatus":
      return <ClientStatusBadge status={badge.value} />;
    case "investigationStatus":
      return <InvestigationStatusBadge status={badge.value} />;
    case "auditScore":
      return <AuditScoreBadge score={badge.score} status={badge.status} />;
  }
}

type SortKey = "reference" | "title" | "meta";

export function SearchResultsTable({ hits, sortable = false }: { hits: SearchHit[]; sortable?: boolean }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return hits;
    const copy = [...hits];
    copy.sort((a, b) => {
      const av = (a[sort.key] ?? "").toString().toLowerCase();
      const bv = (b[sort.key] ?? "").toString().toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [hits, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => (prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function renderHeadCell(sortKey: SortKey, label: string) {
    if (!sortable) return <DataTableHeadCell key={sortKey}>{label}</DataTableHeadCell>;
    return (
      <DataTableSortableHeadCell
        key={sortKey}
        active={sort?.key === sortKey}
        direction={sort?.dir ?? "asc"}
        onClick={() => toggleSort(sortKey)}
      >
        {label}
      </DataTableSortableHeadCell>
    );
  }

  return (
    <DataTable>
      <DataTableHead>
        {renderHeadCell("reference", "Reference")}
        {renderHeadCell("title", "Record")}
        <DataTableHeadCell>Status</DataTableHeadCell>
        {renderHeadCell("meta", "Date")}
      </DataTableHead>
      <DataTableBody>
        {sorted.map((hit) => (
          <DataTableRow key={`${hit.type}-${hit.id}`}>
            <td className="px-4 py-3 align-top">
              <Link href={hit.href} className="font-medium text-primary hover:underline">
                {hit.reference ?? "—"}
              </Link>
            </td>
            <td className="px-4 py-3 align-top">
              <Link href={hit.href} className="font-medium text-foreground hover:underline">
                {hit.title}
              </Link>
              {hit.subtitle ? <div className="text-xs text-muted-foreground">{hit.subtitle}</div> : null}
            </td>
            <td className="px-4 py-3 align-top">{renderBadge(hit.badge)}</td>
            <td className="px-4 py-3 align-top text-sm text-muted-foreground">{formatDate(hit.meta)}</td>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
