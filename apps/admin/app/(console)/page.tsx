"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, LifeBuoy, UserRound, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { StatTilesSkeleton, TableSkeleton, EventGridSkeleton } from "@/components/ui/skeletons";
import { EmptyState, ErrorPanel } from "@/components/ui/states";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { EventCard } from "@/components/events/event-card";
import { audienceLabel } from "@/components/events/audience";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { can } from "@/lib/permissions";
import { formatDate, formatNumber } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-sans text-base font-semibold text-grey-1">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-primary-hover hover:underline">
          {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const admin = useAdmin();
  const router = useRouter();
  const canSeeOrganizations = can(admin, "organizations.read");
  const canSeeEvents = can(admin, "events.read");

  const overview = useResource((signal) => adminApi.overview({ signal }), []);
  const recentOrganizations = useResource((signal) => adminApi.organizations.list({ sort: "-created_at", limit: 5 }, { signal }), [], canSeeOrganizations);
  const upcomingEvents = useResource((signal) => adminApi.events.list({ status: "scheduled", sort: "start_date", limit: 4 }, { signal }), [], canSeeEvents);

  const stats = overview.data && [
    {
      title: "Organizations",
      value: formatNumber(overview.data.organizations.total),
      detail: `${formatNumber(overview.data.organizations.active)} active, ${formatNumber(overview.data.organizations.suspended)} suspended`,
      icon: <Building2 className="h-5 w-5" />,
      iconClassName: "bg-primary-5 text-primary-hover",
    },
    {
      title: "Employees",
      value: formatNumber(overview.data.employees.total),
      detail: "Across all organizations",
      icon: <Users className="h-5 w-5" />,
      iconClassName: "bg-secondary-4 text-success-1",
    },
    {
      title: "Individual users",
      value: formatNumber(overview.data.individuals.total),
      detail: `${formatNumber(overview.data.individuals.newThisMonth)} new this month`,
      icon: <UserRound className="h-5 w-5" />,
      iconClassName: "bg-info-4 text-warning-text",
    },
    {
      title: "Upcoming platform events",
      value: formatNumber(overview.data.platformEvents.upcoming),
      detail: `${formatNumber(overview.data.platformEvents.total)} created in total`,
      icon: <CalendarDays className="h-5 w-5" />,
      iconClassName: "bg-grey-5 text-grey-1",
    },
    {
      title: "Open support tickets",
      value: formatNumber(overview.data.support.open),
      detail: "Waiting for a reply",
      icon: <LifeBuoy className="h-5 w-5" />,
      iconClassName: "bg-error-5 text-error-1",
    },
  ];

  return (
    <>
      <PageHeader title={`Welcome back, ${admin.firstName || "admin"}`} description="What's happening across Wellstaq today." />

      <section aria-label="Platform totals">
        {overview.error ? (
          <div className="rounded-[12px] border border-grey-4 bg-white">
            <ErrorPanel error={overview.error} onRetry={overview.reload} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {stats ? stats.map((stat) => <StatTile key={stat.title} {...stat} />) : <StatTilesSkeleton count={5} />}
          </div>
        )}
      </section>

      {canSeeOrganizations && (
        <section className="rounded-[12px] border border-grey-4 bg-white p-4 sm:p-6" aria-labelledby="recent-organizations">
          <div id="recent-organizations"><SectionHeader title="Newest organizations" href="/organizations" linkLabel="View all" /></div>
          {recentOrganizations.isLoading && !recentOrganizations.data ? (
            <TableSkeleton rows={4} columns={4} />
          ) : recentOrganizations.error ? (
            <ErrorPanel error={recentOrganizations.error} onRetry={recentOrganizations.reload} />
          ) : !recentOrganizations.data?.items.length ? (
            <EmptyState icon={Building2} title="No organizations yet" description="Organizations appear here as soon as a company signs up." className="min-h-[180px]" />
          ) : (
            <DataTable
              caption="Newest organizations"
              rows={recentOrganizations.data.items}
              getRowId={(organization) => organization.id}
              onRowClick={(organization) => router.push(`/organizations/${organization.id}`)}
              columns={[
                {
                  key: "name",
                  header: "Organization",
                  render: (organization) => (
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={organization.name} src={organization.logoUrl} size={32} square />
                      <span className="truncate text-sm font-medium text-grey-1">{organization.name}</span>
                    </div>
                  ),
                },
                { key: "status", header: "Status", render: (organization) => <StatusBadge status={organization.status} /> },
                { key: "employees", header: "Employees", render: (organization) => formatNumber(organization.employeeCount) },
                { key: "joined", header: "Joined", render: (organization) => formatDate(organization.createdAt) },
              ]}
            />
          )}
        </section>
      )}

      {canSeeEvents && (
        <section className="rounded-[12px] border border-grey-4 bg-white p-4 sm:p-6" aria-labelledby="upcoming-events">
          <div id="upcoming-events"><SectionHeader title="Upcoming platform events" href="/events" linkLabel="Manage events" /></div>
          {upcomingEvents.isLoading && !upcomingEvents.data ? (
            <EventGridSkeleton count={4} />
          ) : upcomingEvents.error ? (
            <ErrorPanel error={upcomingEvents.error} onRetry={upcomingEvents.reload} />
          ) : !upcomingEvents.data?.items.length ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming platform events"
              description="Events you create for individual users and organization employees show up here."
              className="min-h-[180px]"
              action={can(admin, "events.manage") && (
                <Link href="/events" className="text-sm font-medium text-primary-hover hover:underline">Go to events</Link>
              )}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {upcomingEvents.data.items.map((event) => (
                <EventCard
                  key={event.id}
                  href={`/events/${event.id}`}
                  title={event.title}
                  imageUrl={event.imageUrl}
                  startDate={event.startDate}
                  time={event.time}
                  status={event.status}
                  participantCount={event.participantCount}
                  meta={<span className="truncate">{audienceLabel(event)}</span>}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
