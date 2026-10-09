"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPills, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { adminApi } from "@/services/admin-api";
import { formatDate, formatNumber, humanize } from "@/lib/format";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import type { OrganizationStatus, OrganizationSummary } from "@/types/admin";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: "all" | OrganizationStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending_setup", label: "Setting up" },
  { value: "suspended", label: "Suspended" },
];

const SORTS = [
  { value: "-created_at", label: "Newest first" },
  { value: "name", label: "Name, A to Z" },
  { value: "-employee_count", label: "Most employees" },
];

const columns: Column<OrganizationSummary>[] = [
  {
    key: "name",
    header: "Organization",
    render: (organization) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={organization.name} src={organization.logoUrl} size={36} square />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-grey-1">{organization.name}</p>
          <p className="truncate text-xs text-grey-2">{organization.owner?.email ?? humanize(organization.industry, "No industry set")}</p>
        </div>
      </div>
    ),
  },
  { key: "status", header: "Status", render: (organization) => <StatusBadge status={organization.status} /> },
  { key: "employees", header: "Employees", render: (organization) => formatNumber(organization.employeeCount) },
  { key: "branches", header: "Branches", render: (organization) => formatNumber(organization.branchCount), hideOnMobile: true },
  { key: "plan", header: "Plan", render: (organization) => organization.planName ?? "No plan" },
  { key: "country", header: "Country", render: (organization) => organization.country ?? "Not set", hideOnMobile: true },
  { key: "created", header: "Joined", render: (organization) => formatDate(organization.createdAt), className: "whitespace-nowrap" },
];

export default function OrganizationsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrganizationStatus>("all");
  const [sort, setSort] = useState(SORTS[0].value);
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim());

  const organizations = useResource(
    (signal) =>
      adminApi.organizations.list(
        { q: debouncedQuery || undefined, status: status === "all" ? undefined : status, sort, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
        { signal },
      ),
    [debouncedQuery, status, sort, page],
  );

  const isFiltered = Boolean(debouncedQuery) || status !== "all";

  return (
    <>
      <PageHeader title="Organizations" description="Every company on Wellstaq, their setup and their people." />

      <section className="rounded-[12px] border border-grey-4 bg-white p-4 sm:p-6" aria-label="Organizations">
        <Toolbar>
          <SearchInput
            value={query}
            onChange={(value) => { setQuery(value); setPage(1); }}
            label="Search organizations"
            placeholder="Search by name or owner email"
          />
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <FilterPills label="Filter by status" options={STATUS_FILTERS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
            <select aria-label="Sort organizations" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="h-9 border border-grey-4 bg-white text-xs">
              {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </Toolbar>

        {organizations.isLoading && !organizations.data ? (
          <TableSkeleton columns={6} />
        ) : organizations.error ? (
          <ErrorPanel error={organizations.error} onRetry={organizations.reload} />
        ) : !organizations.data?.items.length ? (
          isFiltered ? (
            <NoResults onClear={() => { setQuery(""); setStatus("all"); setPage(1); }} />
          ) : (
            <EmptyState icon={Building2} title="No organizations yet" description="Organizations appear here as soon as a company signs up for Wellstaq." />
          )
        ) : (
          <div className={organizations.isLoading ? "opacity-60" : undefined} aria-busy={organizations.isLoading}>
            <DataTable
              caption="Organizations"
              rows={organizations.data.items}
              columns={columns}
              getRowId={(organization) => organization.id}
              onRowClick={(organization) => router.push(`/organizations/${organization.id}`)}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={organizations.data.total} noun="organizations" onPageChange={setPage} />
          </div>
        )}
      </section>
    </>
  );
}
