"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox, Mail } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@wellstaq/ui/modal";
import { Label } from "@wellstaq/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPills, Toolbar } from "@/components/ui/toolbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonCell } from "@/components/ui/avatar";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { can } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { SupportTicket, TicketStatus } from "@/types/admin";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const FILTERS: { value: "all" | TicketStatus; label: string }[] = [{ value: "all", label: "All" }, ...STATUS_OPTIONS];

const columns: Column<SupportTicket>[] = [
  { key: "from", header: "From", render: (ticket) => <PersonCell name={ticket.name} detail={ticket.email} /> },
  { key: "subject", header: "Subject", render: (ticket) => <span className="line-clamp-1 font-medium text-grey-1">{ticket.subject}</span>, className: "max-w-[320px]" },
  { key: "status", header: "Status", render: (ticket) => <StatusBadge status={ticket.status} /> },
  { key: "received", header: "Received", render: (ticket) => formatDateTime(ticket.createdAt), className: "whitespace-nowrap" },
];

export default function SupportPage() {
  const admin = useAdmin();
  const canManage = can(admin, "support.manage");
  const [status, setStatus] = useState<"all" | TicketStatus>("open");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const tickets = useResource(
    (signal) => adminApi.support.list({ status: status === "all" ? undefined : status, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }, { signal }),
    [status, page],
  );
  const selected = tickets.data?.items.find((ticket) => ticket.id === selectedId) ?? null;

  const changeStatus = async (ticket: SupportTicket, next: TicketStatus) => {
    setIsSaving(true);
    try {
      await adminApi.support.updateStatus(ticket.id, next);
      tickets.setData((current) => current && { ...current, items: current.items.map((item) => (item.id === ticket.id ? { ...item, status: next } : item)) });
      toast.success("Ticket updated");
    } catch {
      // The HTTP client shows the error toast.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Support" description="Messages people send from Contact Support in the Wellstaq apps." />

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Support tickets">
        <Toolbar>
          <p className="text-sm text-grey-2">{tickets.data ? `${tickets.data.total} ${tickets.data.total === 1 ? "ticket" : "tickets"}` : "Tickets"}</p>
          <FilterPills label="Filter by status" options={FILTERS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} />
        </Toolbar>

        {tickets.isLoading && !tickets.data ? (
          <TableSkeleton columns={4} />
        ) : tickets.error ? (
          <ErrorPanel error={tickets.error} onRetry={tickets.reload} />
        ) : !tickets.data?.items.length ? (
          status !== "all" ? (
            status === "open" ? (
              <EmptyState icon={Inbox} title="No open tickets" description="Everyone who contacted support has had a reply. New messages land here." />
            ) : (
              <NoResults onClear={() => setStatus("all")} />
            )
          ) : (
            <EmptyState icon={Inbox} title="No support tickets yet" description="When someone uses Contact Support in a Wellstaq app, their message appears here." />
          )
        ) : (
          <div className={tickets.isLoading ? "opacity-60" : undefined} aria-busy={tickets.isLoading}>
            <DataTable caption="Support tickets" rows={tickets.data.items} columns={columns} getRowId={(ticket) => ticket.id} onRowClick={(ticket) => setSelectedId(ticket.id)} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={tickets.data.total} noun="tickets" onPageChange={setPage} />
          </div>
        )}
      </section>

      <Modal presentation="drawer" isOpen={Boolean(selected)} onClose={() => setSelectedId(null)} title="Support ticket" subtitle={selected ? `Received ${formatDateTime(selected.createdAt)}` : undefined}>
        {selected && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="break-words font-sans text-lg font-semibold text-grey-1">{selected.subject}</h3>
              <PersonCell name={selected.name} detail={selected.email} />
            </div>
            <p className="whitespace-pre-line rounded-[12px] border border-line bg-grey-5 p-4 text-sm leading-6 text-grey-1">{selected.message}</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-grey-2">Organization</dt>
                <dd><Link href={`/organizations/${selected.organizationId}`} className="font-medium text-primary-hover hover:underline">View organization</Link></dd>
              </div>
            </dl>
            <div className="space-y-2">
              <Label htmlFor="ticket-status" className="text-sm font-medium text-grey-1">Status</Label>
              {canManage ? (
                <select id="ticket-status" value={selected.status} disabled={isSaving} onChange={(event) => void changeStatus(selected, event.target.value as TicketStatus)} className="h-11 w-full border border-line bg-white text-sm">
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <div><StatusBadge status={selected.status} /></div>
              )}
            </div>
            <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`} className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-line px-4 text-sm font-medium text-grey-1 hover:bg-grey-5">
              <Mail className="h-4 w-4" aria-hidden="true" /> Reply by email
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}
