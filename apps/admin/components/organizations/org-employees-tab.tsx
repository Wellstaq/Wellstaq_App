"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { adminApi } from "@/services/admin-api";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import { formatDate, fullName, humanize } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonCell } from "@/components/ui/avatar";
import { FilterPills, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { AccountDrawer } from "@/components/accounts/account-drawer";
import type { AccountStatus, OrganizationMember } from "@/types/admin";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: "all" | AccountStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "suspended", label: "Suspended" },
];

const columns: Column<OrganizationMember>[] = [
  { key: "name", header: "Employee", render: (member) => <PersonCell name={fullName(member)} detail={member.email} src={member.avatarUrl} /> },
  { key: "branch", header: "Branch", render: (member) => member.branchName ?? "Unassigned" },
  { key: "department", header: "Department", render: (member) => member.departmentName ?? "Unassigned" },
  { key: "role", header: "Role", render: (member) => humanize(member.role, "Member") },
  { key: "status", header: "Status", render: (member) => <StatusBadge status={member.status} /> },
  { key: "joined", header: "Joined", render: (member) => formatDate(member.joinedAt, "Not joined"), className: "whitespace-nowrap", hideOnMobile: true },
];

export function OrgEmployeesTab({ organizationId, canManage }: { organizationId: string; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AccountStatus>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim());

  const members = useResource(
    (signal) =>
      adminApi.organizations.members(
        organizationId,
        { q: debouncedQuery || undefined, status: status === "all" ? undefined : status, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
        { signal },
      ),
    [organizationId, debouncedQuery, status, page],
  );

  const selected = members.data?.items.find((member) => member.id === selectedId) ?? null;
  const isFiltered = Boolean(debouncedQuery) || status !== "all";

  return (
    <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Employees">
      <Toolbar>
        <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} label="Search employees" placeholder="Search by name or email" />
        <FilterPills label="Filter by status" options={STATUS_FILTERS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
      </Toolbar>

      {members.isLoading && !members.data ? (
        <TableSkeleton columns={6} />
      ) : members.error ? (
        <ErrorPanel error={members.error} onRetry={members.reload} />
      ) : !members.data?.items.length ? (
        isFiltered ? (
          <NoResults onClear={() => { setQuery(""); setStatus("all"); setPage(1); }} />
        ) : (
          <EmptyState icon={Users} title="No employees yet" description="Employees show up here once the organization invites them and they accept." />
        )
      ) : (
        <div className={members.isLoading ? "opacity-60" : undefined} aria-busy={members.isLoading}>
          <DataTable caption="Employees" rows={members.data.items} columns={columns} getRowId={(member) => member.id} onRowClick={(member) => setSelectedId(member.id)} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={members.data.total} noun="employees" onPageChange={setPage} />
        </div>
      )}

      <AccountDrawer
        context="Employee"
        canManage={canManage}
        onClose={() => setSelectedId(null)}
        account={
          selected && {
            ...selected,
            details: [
              { label: "Role", value: humanize(selected.role, "Member") },
              { label: "Branch", value: selected.branchName ?? "Unassigned" },
              { label: "Department", value: selected.departmentName ?? "Unassigned" },
              { label: "Joined", value: formatDate(selected.joinedAt, "Not joined") },
            ],
          }
        }
        onStatusChange={(id, nextStatus) =>
          members.setData((current) => current && { ...current, items: current.items.map((member) => (member.id === id ? { ...member, status: nextStatus } : member)) })
        }
      />
    </section>
  );
}
