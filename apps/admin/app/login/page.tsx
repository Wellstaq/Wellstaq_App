"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@wellstaq/ui/button";
import { Input } from "@wellstaq/ui/input";
import { Label } from "@wellstaq/ui/label";
import { AuthCard, FormAlert } from "@/components/shell/auth-card";
import { primaryButton } from "@/components/ui/button-styles";
import { adminApi } from "@/services/admin-api";
import { ApiError } from "@/services/http";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function signInError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 400) return "Email or password is incorrect.";
    if (error.status === 403) return "This account doesn't have admin access.";
    if (error.status === 423) return "This account is locked. Ask a super admin to unlock it.";
    if (error.status === 429) return "Too many attempts. Wait a few minutes and try again.";
    return error.message;
  }
  return "We couldn't sign you in. Try again.";
}

const REASONS: Record<string, string> = {
  expired: "Your session ended. Sign in again to continue.",
  signed_out: "You've signed out.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<{ token: string; method: "totp" | "email" } | null>(null);
  const [code, setCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = () => {
    router.replace(returnTo);
    router.refresh();
  };

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim()) || !password) return;
    setIsPending(true);
    setError(null);
    try {
      const result = await adminApi.auth.login(email.trim(), password);
      if ("twoFaRequired" in result) {
        setChallenge({ token: result.twoFaChallengeToken, method: result.twoFaMethod });
        setIsPending(false);
        return;
      }
      finish();
    } catch (reasonError) {
      setError(signInError(reasonError));
      setIsPending(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!challenge || code.length < 6) return;
    setIsPending(true);
    setError(null);
    try {
      await adminApi.auth.verifyTwoFa(challenge.token, code);
      finish();
    } catch (reasonError) {
      setError(reasonError instanceof ApiError && reasonError.status < 500 ? "That code didn't work. Check it and try again." : signInError(reasonError));
      setIsPending(false);
    }
  };

  if (challenge) {
    return (
      <AuthCard
        title="Verify it's you"
        description={challenge.method === "email" ? `Enter the code we sent to ${email.trim()}.` : "Enter the 6-digit code from your authenticator app."}
      >
        {error && <FormAlert>{error}</FormAlert>}
        <form onSubmit={submitCode} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="code" className="text-sm font-medium text-grey-1">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={8}
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              className="text-center text-lg tracking-[0.3em]"
            />
          </div>
          <Button type="submit" className={`w-full ${primaryButton}`} disabled={code.length < 6 || isPending}>
            {isPending ? "Verifying..." : "Verify and sign in"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setChallenge(null);
              setCode("");
              setError(null);
            }}
            className="text-sm font-medium text-grey-2 hover:text-grey-1"
          >
            Use a different account
          </button>
        </form>
      </AuthCard>
    );
  }

  const canSubmit = EMAIL_PATTERN.test(email.trim()) && password.length > 0 && !isPending;

  return (
    <AuthCard title="Sign in" description="Use your Wellstaq staff account.">
      {reason && REASONS[reason] && !error && <FormAlert tone="info">{REASONS[reason]}</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <form onSubmit={submitCredentials} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-grey-1">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password" className="text-sm font-medium text-grey-1">Password</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-grey-2 hover:text-grey-1 hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="pr-12"
              aria-invalid={error ? true : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-grey-3 hover:text-grey-1"
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <Button type="submit" className={`mt-1 w-full ${primaryButton}`} disabled={!canSubmit}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-grey-5" />}>
      <LoginForm />
    </Suspense>
  );
}
