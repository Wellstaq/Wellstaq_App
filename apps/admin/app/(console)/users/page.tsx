"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "@wellstaq/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, Toolbar } from "@/components/ui/toolbar";
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
import { formatDate, fullName } from "@/lib/format";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import type { AccountStatus, UserSearchResult } from "@/types/admin";

const PAGE_SIZE = 20;
const MIN_QUERY_LENGTH = 2;

const columns: Column<UserSearchResult>[] = [
  { key: "name", header: "Person", render: (person) => <PersonCell name={fullName(person)} detail={person.email} src={person.avatarUrl} /> },
  { key: "organization", header: "Organization", render: (person) => person.organizationName ?? "Unknown" },
  { key: "status", header: "Status", render: (person) => <StatusBadge status={person.status} /> },
  { key: "joined", header: "Joined", render: (person) => formatDate(person.joinedAt, "Not joined"), className: "whitespace-nowrap", hideOnMobile: true },
];

function UsersView() {
  const admin = useAdmin();
  const canManage = can(admin, "organizations.manage");
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim());
  const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const results = useResource(
    (signal) => adminApi.users.search({ q: debouncedQuery, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }, { signal }),
    [debouncedQuery, page],
    canSearch,
  );

  const selected = results.data?.items.find((person) => person.id === selectedId) ?? null;

  return (
    <>
      <PageHeader title="Find a user" description="Search any organization's employees by name or email to view their account and take action." />

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="User search">
        <Toolbar>
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} label="Search users" placeholder="Search by name or email" />
        </Toolbar>

        {!canSearch ? (
          <EmptyState icon={Search} title="Search for a user" description={`Type at least ${MIN_QUERY_LENGTH} characters of a name or email to find someone across every organization.`} />
        ) : results.isLoading && !results.data ? (
          <TableSkeleton columns={4} />
        ) : results.error ? (
          <ErrorPanel error={results.error} onRetry={results.reload} />
        ) : !results.data?.items.length ? (
          <NoResults onClear={() => { setQuery(""); setPage(1); }} />
        ) : (
          <div className={results.isLoading ? "opacity-60" : undefined} aria-busy={results.isLoading}>
            <DataTable caption="Matching users" rows={results.data.items} columns={columns} getRowId={(person) => person.id} onRowClick={(person) => setSelectedId(person.id)} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={results.data.total} noun="people" onPageChange={setPage} />
          </div>
        )}
      </section>

      <AccountDrawer
        context="Employee"
        canManage={canManage}
        onClose={() => setSelectedId(null)}
        account={
          selected && {
            ...selected,
            details: [
              { label: "Organization", value: selected.organizationName ?? "Unknown" },
              { label: "Joined", value: formatDate(selected.joinedAt, "Not joined") },
            ],
          }
        }
        onStatusChange={(id, nextStatus) =>
          results.setData((current) => current && { ...current, items: current.items.map((person) => (person.id === id ? { ...person, status: nextStatus as AccountStatus } : person)) })
        }
      />
    </>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
