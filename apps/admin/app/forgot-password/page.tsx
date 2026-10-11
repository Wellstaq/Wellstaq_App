"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/controls";
import { Input } from "@/components/ui/controls";
import { Label } from "@wellstaq/ui/label";
import { AuthCard, FormAlert } from "@/components/shell/auth-card";
import { primaryButton } from "@/components/ui/button-styles";
import { adminApi } from "@/services/admin-api";
import { ApiError } from "@/services/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      await adminApi.auth.forgotPassword(email.trim());
      setIsSent(true);
    } catch (reason) {
      // Unknown emails must not be revealed, so only infrastructure errors are shown.
      if (reason instanceof ApiError && (reason.status === 0 || reason.status >= 500)) setError(reason.message);
      else setIsSent(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AuthCard title="Reset your password" description="We'll email a reset link if the address belongs to an admin account.">
      {isSent ? (
        <>
          <FormAlert tone="success">If that address has admin access, a reset link is on its way. Check your inbox.</FormAlert>
          <Link href="/login" className="text-sm font-medium text-primary-hover hover:underline">Back to sign in</Link>
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          {error && <FormAlert>{error}</FormAlert>}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-grey-1">Work email</Label>
            <Input id="email" type="email" autoComplete="username" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <Button type="submit" className={`w-full ${primaryButton}`} disabled={!email.trim() || isPending}>
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
          <Link href="/login" className="text-center text-sm font-medium text-grey-2 hover:text-grey-1">Back to sign in</Link>
        </form>
      )}
    </AuthCard>
  );
}
