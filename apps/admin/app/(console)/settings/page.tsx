"use client";

import { useState } from "react";
import { Camera, LockKeyhole } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button, Input } from "@/components/ui/controls";
import { PageHeader } from "@/components/ui/page-header";
import { secondaryButton } from "@/components/ui/button-styles";
import { useAdmin } from "@/components/providers/admin-session";
import { fullName } from "@/lib/format";
import { adminApi } from "@/services/admin-api";

export default function SettingsPage() {
  const admin = useAdmin();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendResetLink = async () => {
    setIsSending(true);
    setError(null);
    try {
      await adminApi.auth.forgotPassword(admin.email);
      setSent(true);
    } catch {
      setError("We couldn't send the reset link. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your admin profile and account security." />

      <section aria-labelledby="profile-heading" className="rounded-[14px] border border-line bg-white p-5 sm:p-6">
        <div className="mb-6">
          <h2 id="profile-heading" className="font-sans text-lg font-semibold text-grey-1">Profile</h2>
          <p className="mt-1 text-sm text-grey-2">Your name and photo appear beside your activity in the admin console.</p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar name={fullName(admin)} src={admin.avatarUrl} size={72} />
          <div>
            <Button type="button" className={secondaryButton} disabled aria-describedby="profile-unavailable">
              <Camera className="h-4 w-4" aria-hidden="true" /> Change photo
            </Button>
            <p className="mt-2 text-xs text-grey-2">JPG or PNG, up to 5 MB.</p>
          </div>
        </div>

        <div className="mt-6 grid max-w-[720px] gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-first-name" className="text-sm font-medium text-grey-1">First name</label>
            <Input id="settings-first-name" value={admin.firstName} readOnly aria-describedby="profile-unavailable" />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-last-name" className="text-sm font-medium text-grey-1">Last name</label>
            <Input id="settings-last-name" value={admin.lastName} readOnly aria-describedby="profile-unavailable" />
          </div>
        </div>
        <p id="profile-unavailable" className="mt-4 text-sm text-grey-2">Photo and name changes will be available when the admin profile service supports them.</p>
      </section>

      <section aria-labelledby="security-heading" className="rounded-[14px] border border-line bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-grey-5 text-grey-2" aria-hidden="true">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <h2 id="security-heading" className="font-sans text-lg font-semibold text-grey-1">Reset password</h2>
            <p className="mt-1 text-sm text-grey-2">We’ll send a secure reset link to {admin.email} so you can choose a new password.</p>
          </div>
        </div>
        {sent ? (
          <p role="status" className="mt-5 max-w-[720px] rounded-[8px] bg-[#EAF7EC] px-4 py-3 text-sm text-[#1C7A2E]">Check your inbox for a password reset link.</p>
        ) : (
          <div className="mt-5">
            <Button type="button" className={secondaryButton} onClick={sendResetLink} disabled={isSending}>
              {isSending ? "Sending..." : "Send password reset link"}
            </Button>
            {error && <p role="alert" className="mt-3 text-sm text-error-1">{error}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
