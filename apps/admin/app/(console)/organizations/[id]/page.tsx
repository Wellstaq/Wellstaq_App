"use client";

import { Suspense, use, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, GitBranch, Layers, ShieldCheck, ShieldOff, Users, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@wellstaq/ui/button";
import { SelectablePill } from "@wellstaq/ui/selectable-pill";
import { BackLink } from "@/components/ui/back-link";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/ui/stat-tile";
import { ErrorPanel } from "@/components/ui/states";
import { DetailSkeleton } from "@/components/ui/skeletons";
import { ActionDialog } from "@/components/ui/action-dialog";
import { dangerButton, secondaryButton } from "@/components/ui/button-styles";
import { OrgOverviewTab } from "@/components/organizations/org-overview-tab";
import { OrgEmployeesTab } from "@/components/organizations/org-employees-tab";
import { OrgClubsTab, OrgDepartmentsTab, OrgEventsTab } from "@/components/organizations/org-collection-tabs";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { can } from "@/lib/permissions";
import { formatDate, formatDateTime, formatNumber, humanize } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "employees", label: "Employees" },
  { value: "departments", label: "Departments" },
  { value: "clubs", label: "Clubs" },
  { value: "events", label: "Events" },
] as const;
type Tab = (typeof TABS)[number]["value"];

function OrganizationDetail({ id }: { id: string }) {
  const admin = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: Tab = TABS.some((item) => item.value === requestedTab) ? (requestedTab as Tab) : "overview";
  const canManage = can(admin, "organizations.manage");
  const organization = useResource((signal) => adminApi.organizations.get(id, { signal }), [id]);
  const [dialog, setDialog] = useState<"suspend" | "reactivate" | null>(null);

  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = TABS.findIndex((item) => item.value === tab);
    const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    selectTab(TABS[next].value);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  if (organization.isLoading && !organization.data) return <DetailSkeleton />;
  if (organization.error || !organization.data) {
    return (
      <>
        <BackLink href="/organizations">Back to organizations</BackLink>
        <section className="rounded-[12px] border border-grey-4 bg-white">
          {organization.error && <ErrorPanel error={organization.error} onRetry={organization.reload} />}
        </section>
      </>
    );
  }

  const data = organization.data;
  const isSuspended = data.status === "suspended";
  const stats = [
    { title: "Employees", value: data.counts.employees, icon: <Users className="h-5 w-5" />, iconClassName: "bg-primary-5 text-primary-hover" },
    { title: "Branches", value: data.counts.branches, icon: <GitBranch className="h-5 w-5" />, iconClassName: "bg-secondary-4 text-success-1" },
    { title: "Departments", value: data.counts.departments, icon: <Layers className="h-5 w-5" />, iconClassName: "bg-info-4 text-warning-text" },
    { title: "Clubs", value: data.counts.clubs, icon: <UsersRound className="h-5 w-5" />, iconClassName: "bg-grey-5 text-grey-1" },
    { title: "Events created", value: data.counts.events, icon: <CalendarDays className="h-5 w-5" />, iconClassName: "bg-primary-5 text-primary-hover" },
  ];

  return (
    <>
      <BackLink href="/organizations">Back to organizations</BackLink>

      <header className="flex flex-col gap-4 rounded-[12px] border border-grey-4 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={data.name} src={data.logoUrl} size={56} square />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="page-title break-words">{data.name}</h1>
              <StatusBadge status={data.status} />
            </div>
            <p className="mt-0.5 text-sm text-grey-2">
              {humanize(data.industry, "Industry not set")} <span aria-hidden="true">·</span> Joined {formatDate(data.createdAt)}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-2">
            {isSuspended ? (
              <Button type="button" size="sm" className={secondaryButton} onClick={() => setDialog("reactivate")}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Reactivate organization
              </Button>
            ) : (
              <Button type="button" size="sm" className={dangerButton} onClick={() => setDialog("suspend")}>
                <ShieldOff className="h-4 w-4" aria-hidden="true" /> Suspend organization
              </Button>
            )}
          </div>
        )}
      </header>

      {isSuspended && (
        <div role="status" className="rounded-[12px] border border-error-4 bg-error-5 p-4 text-sm text-error-1">
          <p className="font-semibold">Suspended {data.suspendedAt ? `on ${formatDateTime(data.suspendedAt)}` : ""}</p>
          {data.suspensionReason && <p className="mt-1 text-grey-1">Reason: {data.suspensionReason}</p>}
          <p className="mt-1 text-grey-2">No one in this organization can sign in until it is reactivated.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => <StatTile key={stat.title} title={stat.title} value={formatNumber(stat.value)} icon={stat.icon} iconClassName={stat.iconClassName} />)}
      </div>

      <div role="tablist" aria-label="Organization sections" onKeyDown={onTabKeyDown} className="no-scrollbar flex gap-1 overflow-x-auto border-b border-grey-4 pb-3">
        {TABS.map((item) => (
          <SelectablePill
            key={item.value}
            role="tab"
            id={`org-tab-${item.value}`}
            aria-controls="org-tab-panel"
            aria-selected={tab === item.value}
            aria-pressed={undefined}
            tabIndex={tab === item.value ? 0 : -1}
            selected={tab === item.value}
            appearance="plain"
            onClick={() => selectTab(item.value)}
            className="min-h-9 whitespace-nowrap px-3 sm:text-sm"
          >
            {item.label}
          </SelectablePill>
        ))}
      </div>

      <div id="org-tab-panel" role="tabpanel" aria-labelledby={`org-tab-${tab}`}>
        {tab === "overview" && <OrgOverviewTab organization={data} />}
        {tab === "employees" && <OrgEmployeesTab organizationId={data.id} canManage={canManage} />}
        {tab === "departments" && <OrgDepartmentsTab organizationId={data.id} />}
        {tab === "clubs" && <OrgClubsTab organizationId={data.id} />}
        {tab === "events" && <OrgEventsTab organizationId={data.id} />}
      </div>

      <ActionDialog
        isOpen={dialog === "suspend"}
        onClose={() => setDialog(null)}
        title={`Suspend ${data.name}?`}
        description="Everyone in this organization is signed out and can't sign in. No data is deleted. You can reactivate it at any time."
        confirmLabel="Suspend organization"
        pendingLabel="Suspending..."
        destructive
        reasonLabel="Reason for suspending"
        onConfirm={async (reason) => {
          const updated = await adminApi.organizations.suspend(data.id, reason);
          organization.setData(() => updated);
          toast.success(`${data.name} is suspended`);
        }}
      />
      <ActionDialog
        isOpen={dialog === "reactivate"}
        onClose={() => setDialog(null)}
        title={`Reactivate ${data.name}?`}
        description="Employees can sign in again straight away."
        confirmLabel="Reactivate organization"
        pendingLabel="Reactivating..."
        onConfirm={async () => {
          const updated = await adminApi.organizations.reactivate(data.id);
          organization.setData(() => updated);
          toast.success(`${data.name} is active again`);
        }}
      />
    </>
  );
}

export default function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <OrganizationDetail id={id} />
    </Suspense>
  );
}

