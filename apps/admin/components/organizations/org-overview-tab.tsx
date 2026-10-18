"use client";

import { useState } from "react";
import { GitBranch } from "@wellstaq/ui/icons";
import { adminApi } from "@/services/admin-api";
import { useResource } from "@/lib/use-resource";
import { formatDate, formatNumber, humanize } from "@/lib/format";
import { EmptyState, ErrorPanel } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/ui/data-table";
import type { OrganizationDetail } from "@/types/admin";

const PAGE_SIZE = 10;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-grey-2">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-grey-1">{value}</dd>
    </div>
  );
}

export function OrgOverviewTab({ organization }: { organization: OrganizationDetail }) {
  const [page, setPage] = useState(1);
  const branches = useResource(
    (signal) => adminApi.organizations.branches(organization.id, { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }, { signal }),
    [organization.id, page],
  );
  const location = [organization.city, organization.state, organization.country].filter(Boolean).join(", ");

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <section className="rounded-[14px] border border-line bg-white p-5 xl:col-span-2" aria-labelledby="org-profile-title">
        <h2 id="org-profile-title" className="mb-4 font-sans text-[17px] font-semibold text-grey-1">Company profile</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Industry" value={humanize(organization.industry)} />
          <Field label="Company size" value={organization.sizeRange ?? "Not set"} />
          <Field label="Work model" value={humanize(organization.workModel)} />
          <Field label="Location" value={location || "Not set"} />
          <div className="sm:col-span-2"><Field label="Address" value={organization.address ?? "Not set"} /></div>
          <Field label="Business email" value={organization.businessEmail ?? "Not set"} />
          <Field label="Phone" value={organization.phoneNumber ?? "Not set"} />
          <div className="sm:col-span-2">
            <Field
              label="Website"
              value={organization.website ? <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary-hover hover:underline">{organization.website}</a> : "Not set"}
            />
          </div>
        </dl>
        <h3 className="mb-3 mt-6 border-t border-line pt-5 font-sans text-sm font-semibold text-grey-1">Account</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Owner" value={organization.owner ? `${organization.owner.name}` : "Not set"} />
          <Field label="Owner email" value={organization.owner?.email ?? "Not set"} />
          <Field label="Plan" value={organization.planName ?? "No plan"} />
          <Field label="Subscription" value={humanize(organization.subscriptionStatus, "None")} />
          <Field label="Joined Wellstaq" value={formatDate(organization.createdAt)} />
        </dl>
      </section>

      <section className="rounded-[14px] border border-line bg-white p-5 xl:col-span-3" aria-labelledby="org-branches-title">
        <h2 id="org-branches-title" className="mb-4 font-sans text-[17px] font-semibold text-grey-1">Branches</h2>
        {branches.isLoading && !branches.data ? (
          <TableSkeleton rows={3} columns={4} />
        ) : branches.error ? (
          <ErrorPanel error={branches.error} onRetry={branches.reload} />
        ) : !branches.data?.items.length ? (
          <EmptyState icon={GitBranch} title="No branches yet" description="Branches appear once the organization finishes setting up its locations." />
        ) : (
          <>
            <DataTable
              caption="Branches"
              rows={branches.data.items}
              getRowId={(branch) => branch.id}
              columns={[
                { key: "name", header: "Branch", render: (branch) => <span className="font-medium text-grey-1">{branch.name}</span> },
                { key: "location", header: "Location", render: (branch) => [branch.city, branch.country].filter(Boolean).join(", ") || "Not set" },
                { key: "manager", header: "Manager", render: (branch) => branch.managerName ?? "Unassigned" },
                { key: "members", header: "Members", render: (branch) => formatNumber(branch.memberCount) },
              ]}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={branches.data.total} noun="branches" onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
