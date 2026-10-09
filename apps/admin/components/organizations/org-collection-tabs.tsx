"use client";

import { useState } from "react";
import Image from "next/image";
import { CalendarDays, Layers, UsersRound } from "lucide-react";
import { adminApi } from "@/services/admin-api";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import { formatDate, formatNumber, plural } from "@/lib/format";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { EventGridSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { FilterPills, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { EventCard } from "@/components/events/event-card";
import type { EventStatus } from "@/types/admin";

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
    <section className="rounded-[12px] border border-grey-4 bg-white p-4 sm:p-6" aria-label="Departments">
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
    <section className="rounded-[12px] border border-grey-4 bg-white p-4 sm:p-6" aria-label="Clubs">
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
              <li key={club.id} className="flex gap-3 rounded-[12px] border border-grey-4 p-3">
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
    <section className="rounded-[12px] border border-grey-4 bg-white p-4 sm:p-6" aria-label="Organization events">
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
