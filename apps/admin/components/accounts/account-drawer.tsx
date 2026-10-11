"use client";

import { useState } from "react";
import { KeyRound, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@wellstaq/ui/modal";
import { Button } from "@/components/ui/controls";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionDialog } from "@/components/ui/action-dialog";
import { dangerButton, secondaryButton } from "@/components/ui/button-styles";
import { adminApi } from "@/services/admin-api";
import { fullName } from "@/lib/format";
import type { AccountStatus } from "@/types/admin";

export interface ManagedAccount {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  status: AccountStatus;
  details: { label: string; value: string }[];
}

type Action = "suspend" | "reactivate" | "reset";

/**
 * Account details and the account actions admins are allowed to take.
 * Shared by organization employees and individual users.
 */
export function AccountDrawer({
  account,
  context,
  canManage,
  onClose,
  onStatusChange,
}: {
  account: ManagedAccount | null;
  context: string;
  canManage: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: AccountStatus) => void;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const name = account ? fullName(account) : "";
  const isSuspended = account?.status === "suspended";

  return (
    <>
      <Modal presentation="drawer" isOpen={Boolean(account)} onClose={onClose} title={context} subtitle="Account details and access">
        {account && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar name={name} src={account.avatarUrl} size={48} />
              <div className="min-w-0">
                <p className="break-words font-display text-lg font-semibold text-grey-1">{name}</p>
                <p className="break-all text-xs text-grey-2">{account.email}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-[12px] border border-line bg-grey-5 p-4">
              <div>
                <dt className="text-xs text-grey-2">Status</dt>
                <dd className="mt-1"><StatusBadge status={account.status} /></dd>
              </div>
              {account.details.map((detail) => (
                <div key={detail.label} className="min-w-0">
                  <dt className="text-xs text-grey-2">{detail.label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium text-grey-1">{detail.value}</dd>
                </div>
              ))}
            </dl>

            {canManage ? (
              <section className="space-y-3" aria-labelledby="account-actions-title">
                <h3 id="account-actions-title" className="font-sans text-sm font-semibold text-grey-1">Account actions</h3>
                <div className="flex flex-col gap-2">
                  <Button type="button" className={`h-11 justify-start ${secondaryButton}`} onClick={() => setAction("reset")} disabled={isSuspended}>
                    <KeyRound className="h-4 w-4" aria-hidden="true" /> Send password reset link
                  </Button>
                  {isSuspended ? (
                    <Button type="button" className={`h-11 justify-start ${secondaryButton}`} onClick={() => setAction("reactivate")}>
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Reactivate account
                    </Button>
                  ) : (
                    <Button type="button" className={`h-11 justify-start ${dangerButton}`} onClick={() => setAction("suspend")} disabled={account.status === "deactivated"}>
                      <ShieldOff className="h-4 w-4" aria-hidden="true" /> Suspend account
                    </Button>
                  )}
                </div>
                <p className="text-xs leading-5 text-grey-2">Every action is recorded in the audit log with your name.</p>
              </section>
            ) : (
              <p className="rounded-[8px] border border-line bg-grey-5 p-3 text-xs leading-5 text-grey-2">Your role can view this account but can&apos;t change it.</p>
            )}
          </div>
        )}
      </Modal>

      {account && (
        <>
          <ActionDialog
            isOpen={action === "suspend"}
            onClose={() => setAction(null)}
            title={`Suspend ${name}?`}
            description="They're signed out everywhere and can't sign in until reactivated. Their data is kept."
            confirmLabel="Suspend account"
            pendingLabel="Suspending..."
            destructive
            reasonLabel="Reason for suspending"
            onConfirm={async (reason) => {
              await adminApi.users.suspend(account.id, reason);
              onStatusChange(account.id, "suspended");
              toast.success(`${name} is suspended`);
            }}
          />
          <ActionDialog
            isOpen={action === "reactivate"}
            onClose={() => setAction(null)}
            title={`Reactivate ${name}?`}
            description="They can sign in again straight away."
            confirmLabel="Reactivate account"
            pendingLabel="Reactivating..."
            onConfirm={async () => {
              await adminApi.users.reactivate(account.id);
              onStatusChange(account.id, "active");
              toast.success(`${name} is active again`);
            }}
          />
          <ActionDialog
            isOpen={action === "reset"}
            onClose={() => setAction(null)}
            title="Send a password reset link?"
            description={`We'll email a reset link to ${account.email}. Their current password keeps working until they choose a new one.`}
            confirmLabel="Send link"
            pendingLabel="Sending..."
            onConfirm={async () => {
              await adminApi.users.sendPasswordReset(account.id);
              toast.success("Password reset link sent");
            }}
          />
        </>
      )}
    </>
  );
}

