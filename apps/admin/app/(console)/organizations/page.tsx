"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CircleCheck, Hourglass, ShieldOff } from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { useOverview } from "@/components/providers/overview";
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

function OrganizationsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const overview = useOverview().data;
  const initialStatus = STATUS_FILTERS.find((option) => option.value === searchParams.get("status"))?.value ?? "all";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<"all" | OrganizationStatus>(initialStatus);
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
  const settingUp = overview ? Math.max(0, overview.organizations.total - overview.organizations.active - overview.organizations.suspended) : 0;

  return (
    <>
      <PageHeader title="Organizations" description="Every company on Wellstaq, their setup and their people." />

      <MetricGrid columns={4}>
        <MetricCard icon={Building2} label="Total" value={overview ? formatNumber(overview.organizations.total) : null} footnote={overview && `+${formatNumber(overview.organizations.newThisMonth)} this month`} footnoteTone={overview && overview.organizations.newThisMonth > 0 ? "positive" : "neutral"} />
        <MetricCard icon={CircleCheck} label="Active" value={overview ? formatNumber(overview.organizations.active) : null} footnote={overview && share(overview.organizations.active, overview.organizations.total)} />
        <MetricCard icon={Hourglass} label="Setting up" value={overview ? formatNumber(settingUp) : null} footnote={overview && share(settingUp, overview.organizations.total)} />
        <MetricCard icon={ShieldOff} label="Suspended" value={overview ? formatNumber(overview.organizations.suspended) : null} footnote={overview && share(overview.organizations.suspended, overview.organizations.total)} footnoteTone={overview && overview.organizations.suspended > 0 ? "negative" : "neutral"} />
      </MetricGrid>

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Organizations">
        <Toolbar>
          <SearchInput
            value={query}
            onChange={(value) => { setQuery(value); setPage(1); }}
            label="Search organizations"
            placeholder="Search by name or owner email"
          />
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <FilterPills label="Filter by status" options={STATUS_FILTERS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
            <select aria-label="Sort organizations" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="h-10 border border-line bg-white text-xs">
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

function share(part: number, total: number) {
  return `${total ? Math.round((part / total) * 100) : 0}% of all organizations`;
}

export default function OrganizationsPage() {
  return (
    <Suspense>
      <OrganizationsView />
    </Suspense>
  );
}
