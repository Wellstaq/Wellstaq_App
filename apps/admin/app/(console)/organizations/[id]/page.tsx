"use client";

import { Suspense, use, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Gift, GitBranch, Layers, ShieldCheck, ShieldOff, Users, UsersRound } from "@wellstaq/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/controls";
import { BackLink } from "@/components/ui/back-link";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { ErrorPanel } from "@/components/ui/states";
import { DetailSkeleton } from "@/components/ui/skeletons";
import { ActionDialog } from "@/components/ui/action-dialog";
import { dangerButton, secondaryButton } from "@/components/ui/button-styles";
import { OrgOverviewTab } from "@/components/organizations/org-overview-tab";
import { OrgEmployeesTab } from "@/components/organizations/org-employees-tab";
import { OrgClubsTab, OrgDepartmentsTab, OrgEventsTab, OrgBillingTab } from "@/components/organizations/org-collection-tabs";
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
  { value: "billing", label: "Billing" },
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
  const [dialog, setDialog] = useState<"suspend" | "reactivate" | "comp" | "revokeComp" | null>(null);

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
        <section className="rounded-[14px] border border-line bg-white">
          {organization.error && <ErrorPanel error={organization.error} onRetry={organization.reload} />}
        </section>
      </>
    );
  }

  const data = organization.data;
  const isSuspended = data.status === "suspended";
  const stats = [
    { label: "Employees", value: data.counts.employees, icon: Users, footnote: `In ${data.counts.branches === 1 ? "1 branch" : `${formatNumber(data.counts.branches)} branches`}` },
    { label: "Branches", value: data.counts.branches, icon: GitBranch, footnote: data.city ?? data.country ?? "Location not set" },
    { label: "Departments", value: data.counts.departments, icon: Layers, footnote: "Across all branches" },
    { label: "Clubs", value: data.counts.clubs, icon: UsersRound, footnote: "Run by members" },
    { label: "Events created", value: data.counts.events, icon: CalendarDays, footnote: "By the organization" },
  ];

  return (
    <>
      <BackLink href="/organizations">Back to organizations</BackLink>

      <header className="flex flex-col gap-4 rounded-[14px] border border-line bg-white p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={data.name} src={data.logoUrl} size={64} square />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words font-sans text-[24px] font-semibold leading-8 tracking-[-0.02em] text-grey-1">{data.name}</h1>
              <StatusBadge status={data.status} />
            </div>
            <p className="mt-0.5 text-sm text-grey-2">
              {humanize(data.industry, "Industry not set")} <span aria-hidden="true">·</span> Joined {formatDate(data.createdAt)}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {data.platformComped ? (
              <Button type="button" size="sm" className={secondaryButton} onClick={() => setDialog("revokeComp")}>
                <Gift className="h-4 w-4" aria-hidden="true" /> Revoke free access
              </Button>
            ) : (
              <Button type="button" size="sm" className={secondaryButton} onClick={() => setDialog("comp")}>
                <Gift className="h-4 w-4" aria-hidden="true" /> Give free access
              </Button>
            )}
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

      {data.platformComped && (
        <div role="status" className="rounded-[14px] border border-line bg-primary-5 p-4 text-sm text-grey-1">
          <p className="font-semibold">Free platform access</p>
          <p className="mt-1 text-grey-2">This organization has free access to Wellstaq, bypassing payment. Revoke it any time from the button above.</p>
        </div>
      )}

      {isSuspended && (
        <div role="status" className="rounded-[14px] border border-error-4 bg-error-5 p-4 text-sm text-error-1">
          <p className="font-semibold">Suspended {data.suspendedAt ? `on ${formatDateTime(data.suspendedAt)}` : ""}</p>
          {data.suspensionReason && <p className="mt-1 text-grey-1">Reason: {data.suspensionReason}</p>}
          <p className="mt-1 text-grey-2">No one in this organization can sign in until it is reactivated.</p>
        </div>
      )}

      <MetricGrid>
        {stats.map((stat) => <MetricCard key={stat.label} icon={stat.icon} label={stat.label} value={formatNumber(stat.value)} footnote={stat.footnote} />)}
      </MetricGrid>

      <div role="tablist" aria-label="Organization sections" onKeyDown={onTabKeyDown} className="no-scrollbar -mb-2 flex gap-6 overflow-x-auto border-b border-line">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`org-tab-${item.value}`}
            aria-controls="org-tab-panel"
            aria-selected={tab === item.value}
            tabIndex={tab === item.value ? 0 : -1}
            onClick={() => selectTab(item.value)}
            className={`relative h-10 whitespace-nowrap text-[15px] transition-colors ${tab === item.value ? "font-medium text-grey-1 after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:rounded-full after:bg-primary-1" : "text-grey-3 hover:text-grey-1"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div id="org-tab-panel" role="tabpanel" aria-labelledby={`org-tab-${tab}`}>
        {tab === "overview" && <OrgOverviewTab organization={data} />}
        {tab === "employees" && <OrgEmployeesTab organizationId={data.id} canManage={canManage} />}
        {tab === "departments" && <OrgDepartmentsTab organizationId={data.id} />}
        {tab === "clubs" && <OrgClubsTab organizationId={data.id} />}
        {tab === "events" && <OrgEventsTab organizationId={data.id} />}
        {tab === "billing" && <OrgBillingTab organization={data} canManage={canManage} onSubscriptionChanged={(updated) => organization.setData(() => updated)} />}
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
      <ActionDialog
        isOpen={dialog === "comp"}
        onClose={() => setDialog(null)}
        title={`Give ${data.name} free access?`}
        description="They can use Wellstaq without a subscription until you revoke it. This doesn't affect any existing paid subscription."
        confirmLabel="Give free access"
        pendingLabel="Granting..."
        onConfirm={async () => {
          const updated = await adminApi.organizations.comp(data.id);
          organization.setData(() => updated);
          toast.success(`${data.name} now has free access`);
        }}
      />
      <ActionDialog
        isOpen={dialog === "revokeComp"}
        onClose={() => setDialog(null)}
        title={`Revoke ${data.name}'s free access?`}
        description="They'll need an active subscription to keep using Wellstaq."
        confirmLabel="Revoke free access"
        pendingLabel="Revoking..."
        destructive
        onConfirm={async () => {
          const updated = await adminApi.organizations.revokeComp(data.id);
          organization.setData(() => updated);
          toast.success(`Free access revoked for ${data.name}`);
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

