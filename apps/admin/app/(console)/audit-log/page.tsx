"use client";

import { useState } from "react";
import { ScrollText } from "@wellstaq/ui/icons";
import { Input } from "@wellstaq/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, Toolbar } from "@/components/ui/toolbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { PersonCell } from "@/components/ui/avatar";
import { adminApi } from "@/services/admin-api";
import { formatDateTime, humanize } from "@/lib/format";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import type { AuditEntry, AuditTargetType } from "@/types/admin";

const PAGE_SIZE = 30;

const TARGETS: { value: "all" | AuditTargetType; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "organization", label: "Organizations" },
  { value: "user", label: "User accounts" },
  { value: "event", label: "Platform events" },
  { value: "admin", label: "Admins" },
  { value: "support_ticket", label: "Support tickets" },
];

const columns: Column<AuditEntry>[] = [
  { key: "when", header: "When", render: (entry) => formatDateTime(entry.createdAt), className: "whitespace-nowrap" },
  { key: "who", header: "Admin", render: (entry) => <PersonCell name={entry.actor.name} detail={entry.actor.email} /> },
  { key: "action", header: "Action", render: (entry) => <span className="font-medium text-grey-1">{humanize(entry.action)}</span> },
  { key: "target", header: "Record", render: (entry) => <span>{entry.targetLabel} <span className="text-grey-3">({humanize(entry.targetType)})</span></span> },
  { key: "reason", header: "Reason", render: (entry) => <span className="line-clamp-2">{entry.reason ?? "None given"}</span>, className: "max-w-[280px]" },
];

export default function AuditLogPage() {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<"all" | AuditTargetType>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim());

  const entries = useResource(
    (signal) =>
      adminApi.auditLog.list(
        {
          q: debouncedQuery || undefined,
          targetType: target === "all" ? undefined : target,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          offset: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        },
        { signal },
      ),
    [debouncedQuery, target, startDate, endDate, page],
  );
  const isFiltered = Boolean(debouncedQuery) || target !== "all" || Boolean(startDate) || Boolean(endDate);
  const clearFilters = () => { setQuery(""); setTarget("all"); setStartDate(""); setEndDate(""); setPage(1); };

  return (
    <>
      <PageHeader title="Audit log" description="Every change made in this console: who made it, when, and why. Entries can't be edited or deleted." />

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Audit log">
        <Toolbar>
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} label="Search the audit log" placeholder="Search by admin or record" />
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter by record type" value={target} onChange={(event) => { setTarget(event.target.value as "all" | AuditTargetType); setPage(1); }} className="h-10 border border-line bg-white text-sm">
              {TARGETS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <Input aria-label="From date" type="date" value={startDate} max={endDate || undefined} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className="h-10 w-[150px] py-0 text-sm" />
            <span className="text-sm text-grey-3">to</span>
            <Input aria-label="To date" type="date" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className="h-10 w-[150px] py-0 text-sm" />
          </div>
        </Toolbar>

        {entries.isLoading && !entries.data ? (
          <TableSkeleton columns={5} />
        ) : entries.error ? (
          <ErrorPanel error={entries.error} onRetry={entries.reload} />
        ) : !entries.data?.items.length ? (
          isFiltered ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <EmptyState icon={ScrollText} title="No activity yet" description="Suspensions, event changes and admin changes are recorded here as they happen." />
          )
        ) : (
          <div className={entries.isLoading ? "opacity-60" : undefined} aria-busy={entries.isLoading}>
            <DataTable caption="Audit log" rows={entries.data.items} columns={columns} getRowId={(entry) => entry.id} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={entries.data.total} noun="entries" onPageChange={setPage} />
          </div>
        )}
      </section>
    </>
  );
}
