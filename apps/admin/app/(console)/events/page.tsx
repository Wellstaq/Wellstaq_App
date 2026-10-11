"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck2, CalendarClock, CalendarDays, Plus } from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { useOverview } from "@/components/providers/overview";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/controls";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPills, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { EmptyState, ErrorPanel, NoResults } from "@/components/ui/states";
import { EventGridSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { primaryButton } from "@/components/ui/button-styles";
import { EventCard } from "@/components/events/event-card";
import { EventFormDrawer } from "@/components/events/event-form-drawer";
import { AUDIENCE_OPTIONS, audienceLabel } from "@/components/events/audience";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { can } from "@/lib/permissions";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import type { EventAudience, EventStatus } from "@/types/admin";

const PAGE_SIZE = 12;

const STATUS_FILTERS: { value: "all" | EventStatus; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "scheduled", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Canceled" },
];

function PlatformEventsView() {
  const admin = useAdmin();
  const router = useRouter();
  const canManage = can(admin, "events.manage");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | EventStatus>("all");
  const [audience, setAudience] = useState<"all" | EventAudience>("all");
  const [page, setPage] = useState(1);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const overview = useOverview().data;
  const [isCreateOpen, setIsCreateOpenState] = useState(() => canManage && searchParams.get("create") === "1");
  const setIsCreateOpen = (open: boolean) => {
    setIsCreateOpenState(open);
    if (!open && searchParams.get("create")) router.replace(pathname, { scroll: false });
  };
  const requested = searchParams.get("create") === "1";
  useEffect(() => {
    if (requested && canManage) setIsCreateOpenState(true);
  }, [requested, canManage]);
  const debouncedQuery = useDebouncedValue(query.trim());

  const events = useResource(
    (signal) =>
      adminApi.events.list(
        {
          q: debouncedQuery || undefined,
          status: status === "all" ? undefined : status,
          audience: audience === "all" ? undefined : audience,
          sort: "start_date",
          offset: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        },
        { signal },
      ),
    [debouncedQuery, status, audience, page],
  );

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };
  const isFiltered = Boolean(debouncedQuery) || status !== "all" || audience !== "all";
  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setAudience("all");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Platform events"
        description="Events created here appear for individual users and organization employees, based on the audience you choose."
        actions={
          canManage && (
            <Button type="button" className={primaryButton} onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create event
            </Button>
          )
        }
      />

      <MetricGrid columns={3}>
        <MetricCard icon={CalendarClock} label="Upcoming" value={overview ? formatNumber(overview.platformEvents.upcoming) : null} footnote="Scheduled and visible to their audience" />
        <MetricCard icon={CalendarDays} label="Created in total" value={overview ? formatNumber(overview.platformEvents.total) : null} footnote="Including past and canceled events" />
        <MetricCard icon={CalendarCheck2} label="Past or canceled" value={overview ? formatNumber(Math.max(0, overview.platformEvents.total - overview.platformEvents.upcoming)) : null} footnote="No longer shown as upcoming" />
      </MetricGrid>

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Platform events">
        <Toolbar>
          <SearchInput value={query} onChange={resetPage(setQuery)} label="Search events" placeholder="Search events" />
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <FilterPills label="Filter by status" options={STATUS_FILTERS} value={status} onChange={resetPage(setStatus)} />
            <select
              aria-label="Filter by audience"
              value={audience}
              onChange={(event) => resetPage(setAudience)(event.target.value as "all" | EventAudience)}
              className="h-10 border border-line bg-white text-xs"
            >
              <option value="all">All audiences</option>
              {AUDIENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </Toolbar>

        {events.isLoading && !events.data ? (
          <EventGridSkeleton count={8} />
        ) : events.error ? (
          <ErrorPanel error={events.error} onRetry={events.reload} />
        ) : !events.data?.items.length ? (
          isFiltered ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No platform events yet"
              description="Create an event to reach individual users, every organization's employees, or a few organizations you choose."
              action={canManage && (
                <Button type="button" className={primaryButton} onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create event
                </Button>
              )}
            />
          )
        ) : (
          <>
            <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 ${events.isLoading ? "opacity-60" : ""}`} aria-busy={events.isLoading}>
              {events.data.items.map((event) => (
                <EventCard
                  key={event.id}
                  href={`/events/${event.id}`}
                  title={event.title}
                  imageUrl={event.imageUrl}
                  startDate={event.startDate}
                  time={event.time}
                  status={event.status}
                  participantCount={event.participantCount}
                  meta={<span className="truncate text-right" title={audienceLabel(event)}>{audienceLabel(event)}</span>}
                />
              ))}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={events.data.total} noun="events" onPageChange={setPage} />
          </>
        )}
      </section>

      <EventFormDrawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSaved={(created) => router.push(`/events/${created.id}`)} />
    </>
  );
}

export default function PlatformEventsPage() {
  return (
    <Suspense>
      <PlatformEventsView />
    </Suspense>
  );
}
