"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Building2, CalendarDays, CalendarPlus, Inbox, ShieldAlert, UserPlus, UserRound, Users } from "lucide-react";
import { Card, CardHeader, ViewAllLink } from "@/components/ui/card";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { TableSkeleton, EventGridSkeleton } from "@/components/ui/skeletons";
import { EmptyState, ErrorPanel } from "@/components/ui/states";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@wellstaq/ui/skeleton";
import { SignupChart } from "@/components/charts/signup-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarList } from "@/components/charts/bar-list";
import { EventCard } from "@/components/events/event-card";
import { audienceLabel } from "@/components/events/audience";
import { useAdmin } from "@/components/providers/admin-session";
import { useOverview } from "@/components/providers/overview";
import { adminApi } from "@/services/admin-api";
import { can } from "@/lib/permissions";
import { formatDate, formatNumber, plural } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { AdminPermission } from "@/types/admin";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon; permission: AdminPermission }[] = [
  { label: "Create event", href: "/events?create=1", icon: CalendarPlus, permission: "events.manage" },
  { label: "Review suspended", href: "/organizations?status=suspended", icon: ShieldAlert, permission: "organizations.read" },
  { label: "Support inbox", href: "/support", icon: Inbox, permission: "support.read" },
  { label: "Find a person", href: "/individuals", icon: UserRound, permission: "individuals.read" },
  { label: "Invite an admin", href: "/team?invite=1", icon: UserPlus, permission: "admins.manage" },
];

export default function OverviewPage() {
  const admin = useAdmin();
  const router = useRouter();
  const overview = useOverview();
  const [hour] = useState(() => new Date().getHours());
  const canSeeOrganizations = can(admin, "organizations.read");
  const canSeeEvents = can(admin, "events.read");

  const recentOrganizations = useResource((signal) => adminApi.organizations.list({ sort: "-created_at", limit: 5 }, { signal }), [], canSeeOrganizations);
  const upcomingEvents = useResource((signal) => adminApi.events.list({ status: "scheduled", sort: "start_date", limit: 4 }, { signal }), [], canSeeEvents);

  const data = overview.data;
  const settingUp = data ? Math.max(0, data.organizations.total - data.organizations.active - data.organizations.suspended) : 0;
  const quickActions = QUICK_ACTIONS.filter((action) => can(admin, action.permission));

  return (
    <>
      <div>
        <h1 className="font-sans text-[28px] font-semibold leading-9 tracking-[-0.02em] text-grey-1 sm:text-[32px] sm:leading-10" suppressHydrationWarning>
          {greeting(hour)}, {admin.firstName || "there"}
        </h1>
        <p className="mt-1 text-[15px] text-grey-2">Here&apos;s how Wellstaq is doing today.</p>
      </div>

      {overview.error ? (
        <Card><ErrorPanel error={overview.error} onRetry={overview.reload} /></Card>
      ) : (
        <MetricGrid>
          <MetricCard
            icon={Building2}
            label="Organizations"
            value={data ? formatNumber(data.organizations.total) : null}
            footnote={data && (data.organizations.newThisMonth > 0 ? `+${formatNumber(data.organizations.newThisMonth)} this month` : "No new sign-ups this month")}
            footnoteTone={data && data.organizations.newThisMonth > 0 ? "positive" : "neutral"}
          />
          <MetricCard
            icon={Users}
            label="Employees"
            value={data ? formatNumber(data.employees.total) : null}
            footnote={data && `In ${plural(data.organizations.active, "active company", "active companies")}`}
          />
          <MetricCard
            icon={UserRound}
            label="Individual users"
            value={data ? formatNumber(data.individuals.total) : null}
            footnote={data && (data.individuals.newThisMonth > 0 ? `+${formatNumber(data.individuals.newThisMonth)} this month` : "No new sign-ups this month")}
            footnoteTone={data && data.individuals.newThisMonth > 0 ? "positive" : "neutral"}
          />
          <MetricCard
            icon={CalendarDays}
            label="Upcoming events"
            value={data ? formatNumber(data.platformEvents.upcoming) : null}
            footnote={data && `${formatNumber(data.platformEvents.total)} created in total`}
          />
          <MetricCard
            icon={Inbox}
            label="Open tickets"
            value={data ? formatNumber(data.support.open) : null}
            footnote={data && (data.support.open > 0 ? "Waiting for a reply" : "All caught up")}
            footnoteTone={data && data.support.open > 0 ? "negative" : "positive"}
          />
        </MetricGrid>
      )}

      {quickActions.length > 0 && (
        <section aria-labelledby="quick-actions">
          <h2 id="quick-actions" className="mb-3 font-sans text-[17px] font-semibold text-grey-1">Quick actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex h-[60px] items-center gap-3 rounded-[12px] border border-line bg-white px-3 text-[15px] font-medium text-grey-1 transition-all hover:-translate-y-px hover:border-primary-border hover:shadow-[0_6px_16px_-10px_rgba(234,106,5,0.45)] active:translate-y-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primary-5 text-primary-hover transition-colors group-hover:bg-primary-mid" aria-hidden="true">
                  <action.icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <span className="truncate">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3" aria-labelledby="signups-title">
          <CardHeader id="signups-title" title="New sign-ups" subtitle="Daily over the last 30 days." className="pb-4" />
          {data ? <SignupChart points={data.signupTrend} /> : <div className="px-5 pb-5"><Skeleton className="h-[300px] rounded-[12px]" /></div>}
        </Card>
        <Card className="xl:col-span-2" aria-labelledby="people-title">
          <CardHeader id="people-title" title="People on Wellstaq" subtitle="Organization employees and individual users." className="pb-6" />
          {data ? (
            <DonutChart
              ariaLabel="People on Wellstaq"
              centerLabel="total people"
              slices={[
                { label: "Employees", value: data.employees.total, color: "#EA6A05" },
                { label: "Individual users", value: data.individuals.total, color: "#2F6FB0" },
              ]}
            />
          ) : (
            <div className="px-5 pb-5"><Skeleton className="h-[196px] rounded-[12px]" /></div>
          )}
        </Card>
      </div>

      {canSeeOrganizations && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-3" aria-labelledby="recent-organizations">
            <CardHeader id="recent-organizations" title="Newest organizations" subtitle="The last five companies to sign up." action={<ViewAllLink href="/organizations" />} className="pb-4" />
            <div className="px-5 pb-5">
              {recentOrganizations.isLoading && !recentOrganizations.data ? (
                <TableSkeleton rows={4} columns={4} />
              ) : recentOrganizations.error ? (
                <ErrorPanel error={recentOrganizations.error} onRetry={recentOrganizations.reload} />
              ) : !recentOrganizations.data?.items.length ? (
                <EmptyState icon={Building2} title="No organizations yet" description="Companies appear here as soon as they sign up." className="min-h-[200px]" />
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
                          <Avatar name={organization.name} src={organization.logoUrl} size={36} square />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-grey-1">{organization.name}</p>
                            <p className="truncate text-[13px] text-grey-3">{organization.country ?? "Country not set"}</p>
                          </div>
                        </div>
                      ),
                    },
                    { key: "employees", header: "Employees", render: (organization) => <span className="tabular-nums">{formatNumber(organization.employeeCount)}</span> },
                    { key: "joined", header: "Joined", render: (organization) => formatDate(organization.createdAt), className: "whitespace-nowrap" },
                    { key: "status", header: "Status", render: (organization) => <StatusBadge status={organization.status} /> },
                  ]}
                />
              )}
            </div>
          </Card>
          <Card className="xl:col-span-2" aria-labelledby="org-status-title">
            <CardHeader id="org-status-title" title="Organizations by status" subtitle="Where every company is right now." className="pb-6" />
            {data ? (
              <BarList
                ariaLabel="Organizations by status"
                items={[
                  { label: "Active", value: data.organizations.active, detail: "Using Wellstaq" },
                  { label: "Setting up", value: settingUp, detail: "Onboarding not finished" },
                  { label: "Suspended", value: data.organizations.suspended, detail: "Sign-in blocked" },
                ]}
              />
            ) : (
              <div className="space-y-4 px-5 pb-5">{[0, 1, 2].map((row) => <Skeleton key={row} className="h-8" />)}</div>
            )}
          </Card>
        </div>
      )}

      {canSeeEvents && (
        <Card aria-labelledby="upcoming-events">
          <CardHeader id="upcoming-events" title="Upcoming platform events" subtitle="What your audience will see next." action={<ViewAllLink href="/events">Manage events</ViewAllLink>} className="pb-4" />
          <div className="px-5 pb-5">
            {upcomingEvents.isLoading && !upcomingEvents.data ? (
              <EventGridSkeleton count={4} />
            ) : upcomingEvents.error ? (
              <ErrorPanel error={upcomingEvents.error} onRetry={upcomingEvents.reload} />
            ) : !upcomingEvents.data?.items.length ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events"
                description="Events you create for individual users and employees show up here."
                className="min-h-[200px]"
                action={can(admin, "events.manage") && <ViewAllLink href="/events?create=1">Create an event</ViewAllLink>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </Card>
      )}
    </>
  );
}
