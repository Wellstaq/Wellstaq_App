"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput, Toolbar } from "@/components/ui/toolbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminApi } from "@/services/admin-api";
import { formatDateTime, formatMoney, humanize } from "@/lib/format";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import type { PaymentTransaction } from "@/types/admin";

const PAGE_SIZE = 20;
const MIN_QUERY_LENGTH = 3;

const columns: Column<PaymentTransaction>[] = [
  { key: "date", header: "Date", render: (t) => formatDateTime(t.createdAt), className: "whitespace-nowrap" },
  { key: "organization", header: "Organization", render: (t) => t.organizationId ? <Link href={`/organizations/${t.organizationId}`} className="font-medium text-primary-hover hover:underline">{t.organizationName ?? "Unknown"}</Link> : (t.organizationName ?? "Unknown") },
  { key: "amount", header: "Amount", render: (t) => formatMoney(t.amount, t.currency) },
  { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
  { key: "method", header: "Method", render: (t) => humanize(t.paymentMethod, "Not set"), hideOnMobile: true },
  { key: "reference", header: "Reference", render: (t) => <span className="font-mono text-xs text-grey-2">{t.externalReference ?? "—"}</span> },
];

function PaymentsView() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim());
  const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const results = useResource(
    (signal) => adminApi.payments.search({ q: debouncedQuery, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }, { signal }),
    [debouncedQuery, page],
    canSearch,
  );

  return (
    <>
      <PageHeader title="Find a payment" description="Search by invoice or payment reference to find which organization a charge belongs to." />

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Payment search">
        <Toolbar>
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} label="Search payments" placeholder="Search by invoice or payment reference" />
        </Toolbar>

        {!canSearch ? (
          <EmptyState icon={Search} title="Search for a payment" description={`Paste at least ${MIN_QUERY_LENGTH} characters of the invoice or payment reference an organization sent you.`} />
        ) : results.isLoading && !results.data ? (
          <TableSkeleton columns={6} />
        ) : results.error ? (
          <ErrorPanel error={results.error} onRetry={results.reload} />
        ) : !results.data?.items.length ? (
          <NoResults onClear={() => { setQuery(""); setPage(1); }} />
        ) : (
          <div className={results.isLoading ? "opacity-60" : undefined} aria-busy={results.isLoading}>
            <DataTable caption="Matching payments" rows={results.data.items} columns={columns} getRowId={(t) => t.id} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={results.data.total} noun="payments" onPageChange={setPage} />
          </div>
        )}
      </section>
    </>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense>
      <PaymentsView />
    </Suspense>
  );
}
