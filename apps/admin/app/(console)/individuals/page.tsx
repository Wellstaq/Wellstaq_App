"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, UserPlus, UserRound } from "@wellstaq/ui/icons";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { useOverview } from "@/components/providers/overview";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPills, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonCell } from "@/components/ui/avatar";
import { AccountDrawer } from "@/components/accounts/account-drawer";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { can } from "@/lib/permissions";
import { formatDate, formatDateTime, formatNumber, fullName } from "@/lib/format";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import type { Individual, IndividualStatus, SignupMethod } from "@/types/admin";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: "all" | IndividualStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending_verification", label: "Unverified" },
  { value: "suspended", label: "Suspended" },
];

const SIGNUP_LABELS: Record<SignupMethod, string> = { email: "Email", google: "Google", apple: "Apple" };

const columns: Column<Individual>[] = [
  { key: "name", header: "Person", render: (person) => <PersonCell name={fullName(person)} detail={person.email} src={person.avatarUrl} /> },
  { key: "status", header: "Status", render: (person) => <StatusBadge status={person.status} /> },
  { key: "signup", header: "Signed up with", render: (person) => SIGNUP_LABELS[person.signupMethod] ?? "Unknown" },
  { key: "country", header: "Country", render: (person) => person.country ?? "Not set", hideOnMobile: true },
  { key: "joined", header: "Joined", render: (person) => formatDate(person.createdAt), className: "whitespace-nowrap" },
  { key: "lastLogin", header: "Last sign-in", render: (person) => formatDateTime(person.lastLoginAt), className: "whitespace-nowrap", hideOnMobile: true },
];

function IndividualsView() {
  const admin = useAdmin();
  const canManage = can(admin, "individuals.manage");
  const searchParams = useSearchParams();
  const overview = useOverview().data;
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<"all" | IndividualStatus>(STATUS_FILTERS.find((option) => option.value === searchParams.get("status"))?.value ?? "all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim());

  const individuals = useResource(
    (signal) =>
      adminApi.individuals.list(
        { q: debouncedQuery || undefined, status: status === "all" ? undefined : status, sort: "-created_at", offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
        { signal },
      ),
    [debouncedQuery, status, page],
  );

  const selected = individuals.data?.items.find((person) => person.id === selectedId) ?? null;
  const isFiltered = Boolean(debouncedQuery) || status !== "all";

  return (
    <>
      <PageHeader title="Individual users" description="People who use Wellstaq on their own, without an organization." />

      <MetricGrid columns={3}>
        <MetricCard icon={UserRound} label="Total" value={overview ? formatNumber(overview.individuals.total) : null} footnote="Signed up without an organization" />
        <MetricCard icon={BadgeCheck} label="Active" value={overview ? formatNumber(overview.individuals.active) : null} footnote={overview && `${overview.individuals.total ? Math.round((overview.individuals.active / overview.individuals.total) * 100) : 0}% of individual users`} />
        <MetricCard icon={UserPlus} label="New this month" value={overview ? formatNumber(overview.individuals.newThisMonth) : null} footnote="Since the 1st of the month" footnoteTone={overview && overview.individuals.newThisMonth > 0 ? "positive" : "neutral"} />
      </MetricGrid>

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Individual users">
        <Toolbar>
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} label="Search individual users" placeholder="Search by name or email" />
          <FilterPills label="Filter by status" options={STATUS_FILTERS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
        </Toolbar>

        {individuals.isLoading && !individuals.data ? (
          <TableSkeleton columns={6} />
        ) : individuals.error ? (
          <ErrorPanel error={individuals.error} onRetry={individuals.reload} />
        ) : !individuals.data?.items.length ? (
          isFiltered ? (
            <NoResults onClear={() => { setQuery(""); setStatus("all"); setPage(1); }} />
          ) : (
            <EmptyState icon={UserRound} title="No individual users yet" description="When people sign up for Wellstaq without an organization, they appear here." />
          )
        ) : (
          <div className={individuals.isLoading ? "opacity-60" : undefined} aria-busy={individuals.isLoading}>
            <DataTable caption="Individual users" rows={individuals.data.items} columns={columns} getRowId={(person) => person.id} onRowClick={(person) => setSelectedId(person.id)} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={individuals.data.total} noun="people" onPageChange={setPage} />
          </div>
        )}
      </section>

      <AccountDrawer
        context="Individual user"
        canManage={canManage}
        onClose={() => setSelectedId(null)}
        account={
          selected && {
            ...selected,
            details: [
              { label: "Signed up with", value: SIGNUP_LABELS[selected.signupMethod] ?? "Unknown" },
              { label: "Email verified", value: selected.emailVerified ? "Yes" : "No" },
              { label: "Country", value: selected.country ?? "Not set" },
              { label: "Joined", value: formatDate(selected.createdAt) },
              { label: "Last sign-in", value: formatDateTime(selected.lastLoginAt) },
              ...(selected.suspensionReason ? [{ label: "Suspension reason", value: selected.suspensionReason }] : []),
            ],
          }
        }
        onStatusChange={(id, nextStatus) =>
          individuals.setData((current) =>
            current && { ...current, items: current.items.map((person) => (person.id === id ? { ...person, status: nextStatus as IndividualStatus } : person)) },
          )
        }
      />
    </>
  );
}

export default function IndividualsPage() {
  return (
    <Suspense>
      <IndividualsView />
    </Suspense>
  );
}
