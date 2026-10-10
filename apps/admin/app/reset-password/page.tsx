"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@wellstaq/ui/button";
import { Input } from "@wellstaq/ui/input";
import { Label } from "@wellstaq/ui/label";
import { AuthCard, FormAlert } from "@/components/shell/auth-card";
import { primaryButton } from "@/components/ui/button-styles";
import { adminApi } from "@/services/admin-api";
import { ApiError } from "@/services/http";

const MIN_LENGTH = 12;

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit = token && password.length >= MIN_LENGTH && confirmation === password && !isPending;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsPending(true);
    setError(null);
    try {
      await adminApi.auth.resetPassword(token, password);
      setIsDone(true);
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status < 500 && reason.status !== 0 ? "This reset link is invalid or has expired. Request a new one." : "We couldn't reset your password. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title="Reset link missing" description="Open the link from your email again, or request a new one.">
        <Link href="/forgot-password" className="text-sm font-medium text-primary-hover hover:underline">Request a new link</Link>
      </AuthCard>
    );
  }

  if (isDone) {
    return (
      <AuthCard title="Password updated" description="You can now sign in with your new password.">
        <Link href="/login" className="text-sm font-medium text-primary-hover hover:underline">Go to sign in</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" description={`Use at least ${MIN_LENGTH} characters.`}>
      {error && <FormAlert>{error}</FormAlert>}
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-medium text-grey-1">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={tooShort || undefined} aria-describedby="password-help" />
          <p id="password-help" className={`text-xs ${tooShort ? "text-error-1" : "text-grey-2"}`}>At least {MIN_LENGTH} characters.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmation" className="text-sm font-medium text-grey-1">Confirm password</Label>
          <Input id="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} aria-invalid={mismatch || undefined} aria-describedby={mismatch ? "confirmation-error" : undefined} />
          {mismatch && <p id="confirmation-error" className="text-xs text-error-1">Passwords don&apos;t match.</p>}
        </div>
        <Button type="submit" className={`w-full ${primaryButton}`} disabled={!canSubmit}>
          {isPending ? "Saving..." : "Save password"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-grey-5" />}>
      <ResetForm />
    </Suspense>
  );
}
