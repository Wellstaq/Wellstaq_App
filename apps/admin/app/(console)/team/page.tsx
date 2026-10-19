"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Trash2, UserPlus } from "@wellstaq/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/controls";
import { Input } from "@/components/ui/controls";
import { Label } from "@wellstaq/ui/label";
import { Modal } from "@wellstaq/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorPanel } from "@/components/ui/states";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonCell } from "@/components/ui/avatar";
import { ActionDialog } from "@/components/ui/action-dialog";
import { primaryButton, secondaryButton } from "@/components/ui/button-styles";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { ApiError } from "@/services/http";
import { can, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import { formatDateTime, fullName } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import type { AdminRole, AdminUser } from "@/types/admin";

const PAGE_SIZE = 20;
const ROLES = Object.keys(ROLE_LABELS) as AdminRole[];

function InviteDrawer({ isOpen, onClose, onInvited }: { isOpen: boolean; onClose: () => void; onInvited: (admin: AdminUser) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setRole("support");
    setError(null);
  }, [isOpen]);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    setIsPending(true);
    setError(null);
    try {
      const invited = await adminApi.admins.invite(email.trim(), role);
      toast.success(`Invite sent to ${email.trim()}`);
      onInvited(invited);
      onClose();
    } catch (reason) {
      if (reason instanceof ApiError) setError(reason.status === 409 ? "That email already belongs to an admin." : reason.fieldErrors?.email ?? reason.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      presentation="drawer"
      isOpen={isOpen}
      onClose={() => !isPending && onClose()}
      title="Invite an admin"
      subtitle="They'll get an email to set a password and turn on two-step verification."
      footer={
        <>
          <Button type="button" className={secondaryButton} onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" form="invite-admin-form" className={primaryButton} disabled={!isValid || isPending}>{isPending ? "Sending..." : "Send invite"}</Button>
        </>
      }
    >
      <form id="invite-admin-form" onSubmit={submit} className="space-y-5">
        {error && <p role="alert" className="rounded-[8px] border border-error-4 bg-error-5 px-3 py-2 text-sm text-error-1">{error}</p>}
        <div className="space-y-2">
          <Label htmlFor="invite-email" className="text-sm font-medium text-grey-1">Work email</Label>
          <Input id="invite-email" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-grey-1">Role</legend>
          {ROLES.map((value) => (
            <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-[8px] border p-3 ${role === value ? "border-primary-1 bg-primary-5" : "border-line hover:bg-grey-5"}`}>
              <input type="radio" name="admin-role" value={value} checked={role === value} onChange={() => setRole(value)} className="mt-0.5 h-4 w-4 accent-[#C45700]" />
              <span>
                <span className="block text-sm font-medium text-grey-1">{ROLE_LABELS[value]}</span>
                <span className="block text-xs leading-5 text-grey-2">{ROLE_DESCRIPTIONS[value]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </form>
    </Modal>
  );
}

function AdminTeamView() {
  const me = useAdmin();
  const canManage = can(me, "admins.manage");
  const [page, setPage] = useState(1);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInviteOpen, setIsInviteOpenState] = useState(() => canManage && searchParams.get("invite") === "1");
  const setIsInviteOpen = (open: boolean) => {
    setIsInviteOpenState(open);
    if (!open && searchParams.get("invite")) router.replace(pathname, { scroll: false });
  };
  const requested = searchParams.get("invite") === "1";
  useEffect(() => {
    if (requested && canManage) setIsInviteOpenState(true);
  }, [requested, canManage]);
  const [removing, setRemoving] = useState<AdminUser | null>(null);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const admins = useResource((signal) => adminApi.admins.list({ offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }, { signal }), [page], canManage);

  const changeRole = async (target: AdminUser, role: AdminRole) => {
    setSavingRoleId(target.id);
    try {
      const updated = await adminApi.admins.updateRole(target.id, role);
      admins.setData((current) => current && { ...current, items: current.items.map((item) => (item.id === target.id ? updated : item)) });
      toast.success(`${fullName(target)} is now ${ROLE_LABELS[role].toLowerCase()}`);
    } catch {
      // The HTTP client shows the error toast.
    } finally {
      setSavingRoleId(null);
    }
  };

  const columns: Column<AdminUser>[] = [
    { key: "name", header: "Admin", render: (item) => <PersonCell name={`${fullName(item)}${item.id === me.id ? " (you)" : ""}`} detail={item.email} /> },
    {
      key: "role",
      header: "Role",
      render: (item) =>
        item.id === me.id ? (
          ROLE_LABELS[item.role]
        ) : (
          <select
            aria-label={`Role for ${fullName(item)}`}
            value={item.role}
            disabled={savingRoleId === item.id}
            onChange={(event) => void changeRole(item, event.target.value as AdminRole)}
            className="h-10 border border-line bg-white text-sm"
          >
            {ROLES.map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}
          </select>
        ),
    },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "twoFa", header: "Two-step verification", render: (item) => (item.twoFaEnabled ? "On" : <span className="font-medium text-error-1">Off</span>) },
    { key: "lastLogin", header: "Last sign-in", render: (item) => formatDateTime(item.lastLoginAt), className: "whitespace-nowrap", hideOnMobile: true },
    {
      key: "actions",
      header: "Actions",
      render: (item) =>
        item.id === me.id ? null : (
          <button type="button" onClick={() => setRemoving(item)} className="inline-flex h-10 items-center justify-between gap-1.5 rounded-[8px] px-2 text-sm font-medium text-error-1 hover:bg-error-5">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
          </button>
        ),
    },
  ];

  if (!canManage) {
    return (
      <>
        <PageHeader title="Admin team" />
        <section className="rounded-[14px] border border-line bg-white">
          <ErrorPanel error={new ApiError("", 403, "FORBIDDEN")} />
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Admin team"
        description="Wellstaq staff who can use this console. Every admin must use two-step verification."
        actions={
          <Button type="button" className={primaryButton} onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Invite admin
          </Button>
        }
      />

      <section className="rounded-[14px] border border-line bg-white p-4 sm:p-5" aria-label="Admins">
        {admins.isLoading && !admins.data ? (
          <TableSkeleton columns={5} rows={4} />
        ) : admins.error ? (
          <ErrorPanel error={admins.error} onRetry={admins.reload} />
        ) : !admins.data?.items.length ? (
          <EmptyState icon={ShieldCheck} title="No admins listed" description="Invite the Wellstaq staff who need access to this console." />
        ) : (
          <>
            <DataTable caption="Admins" rows={admins.data.items} columns={columns} getRowId={(item) => item.id} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={admins.data.total} noun="admins" onPageChange={setPage} />
          </>
        )}
      </section>

      <InviteDrawer isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onInvited={() => admins.reload()} />
      <ActionDialog
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={removing ? `Remove ${fullName(removing)}?` : "Remove admin?"}
        description="They lose access to the admin console immediately and are signed out. Their past actions stay in the audit log."
        confirmLabel="Remove admin"
        pendingLabel="Removing..."
        destructive
        onConfirm={async () => {
          if (!removing) return;
          await adminApi.admins.remove(removing.id);
          admins.setData((current) => current && { ...current, items: current.items.filter((item) => item.id !== removing.id), total: current.total - 1 });
          toast.success(`${fullName(removing)} was removed`);
        }}
      />
    </>
  );
}

export default function AdminTeamPage() {
  return (
    <Suspense>
      <AdminTeamView />
    </Suspense>
  );
}
