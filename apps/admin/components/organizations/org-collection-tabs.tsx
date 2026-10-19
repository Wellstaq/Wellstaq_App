"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CalendarDays, CreditCard, Layers, UsersRound } from "@wellstaq/ui/icons";
import { Modal } from "@wellstaq/ui/modal";
import { Label } from "@wellstaq/ui/label";
import { Button } from "@/components/ui/controls";
import { primaryButton as primaryButtonStyle, secondaryButton as secondaryButtonStyle } from "@/components/ui/button-styles";
import { adminApi } from "@/services/admin-api";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import { formatDate, formatDateTime, formatMoney, formatNumber, humanize, plural } from "@/lib/format";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { EventGridSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { FilterPills, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { EventCard } from "@/components/events/event-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EventStatus, OrganizationDetail } from "@/types/admin";

const TABLE_PAGE_SIZE = 20;
const GRID_PAGE_SIZE = 12;

export function OrgDepartmentsTab({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim());
  const departments = useResource(
    (signal) => adminApi.organizations.departments(organizationId, { q: debouncedQuery || undefined, offset: (page - 1) * TABLE_PAGE_SIZE, limit: TABLE_PAGE_SIZE }, { signal }),
    [organizationId, debouncedQuery, page],
  );

  return (
    <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Departments">
      <Toolbar>
        <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} label="Search departments" placeholder="Search departments" />
      </Toolbar>
      {departments.isLoading && !departments.data ? (
        <TableSkeleton columns={4} rows={5} />
      ) : departments.error ? (
        <ErrorPanel error={departments.error} onRetry={departments.reload} />
      ) : !departments.data?.items.length ? (
        debouncedQuery ? (
          <NoResults onClear={() => setQuery("")} />
        ) : (
          <EmptyState icon={Layers} title="No departments yet" description="Departments appear here when the organization creates them." />
        )
      ) : (
        <>
          <DataTable
            caption="Departments"
            rows={departments.data.items}
            getRowId={(department) => department.id}
            columns={[
              { key: "name", header: "Department", render: (department) => <span className="font-medium text-grey-1">{department.name}</span> },
              { key: "branch", header: "Branch", render: (department) => department.branchName ?? "All branches" },
              { key: "head", header: "Head", render: (department) => department.headName ?? "Unassigned" },
              { key: "members", header: "Members", render: (department) => formatNumber(department.memberCount) },
            ]}
          />
          <Pagination page={page} pageSize={TABLE_PAGE_SIZE} total={departments.data.total} noun="departments" onPageChange={setPage} />
        </>
      )}
    </section>
  );
}

export function OrgClubsTab({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim());
  const clubs = useResource(
    (signal) => adminApi.organizations.clubs(organizationId, { q: debouncedQuery || undefined, offset: (page - 1) * GRID_PAGE_SIZE, limit: GRID_PAGE_SIZE }, { signal }),
    [organizationId, debouncedQuery, page],
  );

  return (
    <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Clubs">
      <Toolbar>
        <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} label="Search clubs" placeholder="Search clubs" />
      </Toolbar>
      {clubs.isLoading && !clubs.data ? (
        <EventGridSkeleton count={4} />
      ) : clubs.error ? (
        <ErrorPanel error={clubs.error} onRetry={clubs.reload} />
      ) : !clubs.data?.items.length ? (
        debouncedQuery ? (
          <NoResults onClear={() => setQuery("")} />
        ) : (
          <EmptyState icon={UsersRound} title="No clubs yet" description="Clubs appear here when employees or admins in this organization start one." />
        )
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.data.items.map((club) => (
              <li key={club.id} className="flex gap-2 rounded-[12px] border border-line p-3">
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-grey-5 text-grey-3">
                  {club.imageUrl ? <Image src={club.imageUrl} alt="" fill sizes="64px" className="object-cover" referrerPolicy="no-referrer" /> : <UsersRound className="h-6 w-6" aria-hidden="true" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-grey-1">{club.name}</p>
                  <p className="text-xs text-grey-2">{plural(club.memberCount, "member")} {club.branchName ? `in ${club.branchName}` : ""}</p>
                  {club.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-grey-2">{club.description}</p>}
                  <p className="mt-1 text-xs text-grey-3">Started {formatDate(club.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={GRID_PAGE_SIZE} total={clubs.data.total} noun="clubs" onPageChange={setPage} />
        </>
      )}
    </section>
  );
}

const EVENT_FILTERS: { value: "all" | EventStatus; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "scheduled", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Canceled" },
];

export function OrgEventsTab({ organizationId }: { organizationId: string }) {
  const [status, setStatus] = useState<"all" | EventStatus>("all");
  const [page, setPage] = useState(1);
  const events = useResource(
    (signal) => adminApi.organizations.events(organizationId, { status: status === "all" ? undefined : status, sort: "-start_date", offset: (page - 1) * GRID_PAGE_SIZE, limit: GRID_PAGE_SIZE }, { signal }),
    [organizationId, status, page],
  );

  return (
    <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Organization events">
      <Toolbar>
        <p className="text-sm text-grey-2">{events.data ? plural(events.data.total, "event") : "Events"} created by this organization</p>
        <FilterPills label="Filter by status" options={EVENT_FILTERS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
      </Toolbar>
      {events.isLoading && !events.data ? (
        <EventGridSkeleton count={4} />
      ) : events.error ? (
        <ErrorPanel error={events.error} onRetry={events.reload} />
      ) : !events.data?.items.length ? (
        status !== "all" ? (
          <NoResults onClear={() => setStatus("all")} />
        ) : (
          <EmptyState icon={CalendarDays} title="No events yet" description="Events this organization creates for its employees appear here." />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {events.data.items.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                imageUrl={event.imageUrl}
                startDate={event.startDate}
                time={event.time}
                status={event.status}
                participantCount={event.participantCount}
                meta={event.branchName && <span className="truncate">{event.branchName}</span>}
              />
            ))}
          </div>
          <Pagination page={page} pageSize={GRID_PAGE_SIZE} total={events.data.total} noun="events" onPageChange={setPage} />
        </>
      )}
    </section>
  );
}

function ActivateSubscriptionDialog({ isOpen, onClose, organizationId, onActivated }: { isOpen: boolean; onClose: () => void; organizationId: string; onActivated: (updated: OrganizationDetail) => void }) {
  const reasonId = useId();
  const planId = useId();
  const plans = useResource((signal) => adminApi.plans.list({ signal }), [], isOpen);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlanId("");
    setReason("");
    setError(null);
    setIsPending(false);
  }, [isOpen]);

  const canConfirm = !isPending && Boolean(selectedPlanId) && reason.trim().length >= 10;

  const confirm = async () => {
    if (!canConfirm) return;
    setIsPending(true);
    setError(null);
    try {
      const updated = await adminApi.organizations.activateSubscription(organizationId, selectedPlanId, reason.trim());
      onActivated(updated);
      toast.success("Subscription activated");
      onClose();
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : "We couldn't activate this subscription. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isPending && onClose()}
      title="Manually activate a subscription"
      size="compact"
      footer={
        <>
          <Button type="button" size="sm" className={secondaryButtonStyle} onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="button" size="sm" className={primaryButtonStyle} onClick={confirm} disabled={!canConfirm} aria-busy={isPending}>
            {isPending ? "Activating..." : "Activate subscription"}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-grey-2">For when a payment was confirmed directly with Paystack but the webhook that should have activated it never arrived. This bypasses checkout.</p>
      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor={planId} className="text-sm font-medium text-grey-1">Plan</Label>
        <select
          id={planId}
          value={selectedPlanId}
          onChange={(event) => setSelectedPlanId(event.target.value)}
          className="h-10 w-full rounded-[8px] border border-line bg-white px-3 text-sm text-grey-1 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        >
          <option value="">{plans.isLoading ? "Loading plans..." : "Select a plan"}</option>
          {plans.data?.items.map((plan) => (
            <option key={plan.id} value={plan.id}>{plan.name} — {formatMoney(plan.amount, plan.currency)}/{plan.billingInterval === "annual" ? "year" : "month"}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor={reasonId} className="text-sm font-medium text-grey-1">Reason</Label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-[8px] border border-line bg-white p-3 text-sm text-grey-1 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        />
        <p className="text-xs text-grey-2">Saved to the audit log. At least 10 characters.</p>
      </div>
      {error && <p role="alert" className="mt-4 rounded-[8px] border border-error-4 bg-error-5 px-3 py-2 text-sm text-error-1">{error}</p>}
    </Modal>
  );
}

export function OrgBillingTab({ organizationId, canManage, onSubscriptionActivated }: { organizationId: string; canManage: boolean; onSubscriptionActivated: (updated: OrganizationDetail) => void }) {
  const [page, setPage] = useState(1);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const transactions = useResource(
    (signal) => adminApi.organizations.transactions(organizationId, { offset: (page - 1) * TABLE_PAGE_SIZE, limit: TABLE_PAGE_SIZE }, { signal }),
    [organizationId, page],
  );

  return (
    <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Billing history">
      <Toolbar>
        <p className="text-sm text-grey-2">{transactions.data ? plural(transactions.data.total, "transaction") : "Transactions"} for this organization</p>
        {canManage && (
          <Button type="button" size="sm" className={secondaryButtonStyle} onClick={() => setIsActivateOpen(true)}>
            Manually activate subscription
          </Button>
        )}
      </Toolbar>
      <ActivateSubscriptionDialog isOpen={isActivateOpen} onClose={() => setIsActivateOpen(false)} organizationId={organizationId} onActivated={onSubscriptionActivated} />
      {transactions.isLoading && !transactions.data ? (
        <TableSkeleton columns={5} rows={5} />
      ) : transactions.error ? (
        <ErrorPanel error={transactions.error} onRetry={transactions.reload} />
      ) : !transactions.data?.items.length ? (
        <EmptyState icon={CreditCard} title="No payment history yet" description="Charges, renewals, and refunds for this organization appear here." />
      ) : (
        <>
          <DataTable
            caption="Transactions"
            rows={transactions.data.items}
            getRowId={(transaction) => transaction.id}
            columns={[
              { key: "date", header: "Date", render: (transaction) => formatDateTime(transaction.createdAt), className: "whitespace-nowrap" },
              { key: "amount", header: "Amount", render: (transaction) => formatMoney(transaction.amount, transaction.currency) },
              { key: "status", header: "Status", render: (transaction) => <StatusBadge status={transaction.status} /> },
              { key: "method", header: "Method", render: (transaction) => humanize(transaction.paymentMethod, "Not set") },
              { key: "reference", header: "Reference", render: (transaction) => <span className="font-mono text-xs text-grey-2">{transaction.externalReference ?? "—"}</span> },
            ]}
          />
          <Pagination page={page} pageSize={TABLE_PAGE_SIZE} total={transactions.data.total} noun="transactions" onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
