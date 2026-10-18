"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, LockKeyhole } from "@wellstaq/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { Button, Input } from "@/components/ui/controls";
import { PageHeader } from "@/components/ui/page-header";
import { secondaryButton, primaryButton } from "@/components/ui/button-styles";
import { useAdminSession } from "@/components/providers/admin-session";
import { fullName } from "@/lib/format";
import { adminApi } from "@/services/admin-api";
import { ApiError } from "@/services/http";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function SettingsPage() {
  const { admin, setAdmin } = useAdminSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(admin.firstName);
  const [lastName, setLastName] = useState(admin.lastName);
  const [avatarUrl, setAvatarUrl] = useState(admin.avatarUrl);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = firstName !== admin.firstName || lastName !== admin.lastName || avatarUrl !== admin.avatarUrl;
  const canSave = isDirty && firstName.trim().length > 0 && lastName.trim().length > 0 && !isSavingProfile;

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

  const handlePhotoSelect = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Images must be 5 MB or smaller.");
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const { uploadUrl, mediaUrl } = await adminApi.storage.requestUploadUrl(file.type, "admin-avatars");
      const response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Upload failed");
      setAvatarUrl(mediaUrl);
    } catch {
      toast.error("The photo didn't upload. Try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    if (!canSave) return;
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await adminApi.auth.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), avatarUrl });
      setAdmin(updated);
      toast.success("Profile updated");
    } catch (reason) {
      setProfileError(reason instanceof ApiError ? reason.message : "We couldn't save your profile. Try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your admin profile and account security." />

      <section aria-labelledby="profile-heading" className="rounded-[14px] border border-line bg-white p-5 sm:p-6">
        <div className="mb-6">
          <h2 id="profile-heading" className="font-sans text-lg font-semibold text-grey-1">Profile</h2>
          <p className="mt-1 text-sm text-grey-2">Your name and photo appear beside your activity in the admin console. Only you can change them.</p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar name={fullName({ firstName, lastName })} src={avatarUrl} size={72} />
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handlePhotoSelect(event.target)} />
            <Button type="button" className={secondaryButton} onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto}>
              <Camera className="h-4 w-4" aria-hidden="true" /> {isUploadingPhoto ? "Uploading..." : "Change photo"}
            </Button>
            <p className="mt-2 text-xs text-grey-2">JPG or PNG, up to 5 MB.</p>
          </div>
        </div>

        <div className="mt-6 grid max-w-[720px] gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-first-name" className="text-sm font-medium text-grey-1">First name</label>
            <Input id="settings-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-last-name" className="text-sm font-medium text-grey-1">Last name</label>
            <Input id="settings-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </div>
        </div>
        {profileError && <p role="alert" className="mt-4 text-sm text-error-1">{profileError}</p>}
        <div className="mt-5">
          <Button type="button" className={primaryButton} onClick={saveProfile} disabled={!canSave}>
            {isSavingProfile ? "Saving..." : "Save changes"}
          </Button>
        </div>
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
