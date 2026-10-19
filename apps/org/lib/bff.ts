// Rules for the same-origin org proxy (app/api/backend/[...path]/route.ts).
// Kept dependency-free so they can be unit tested without Next.js.
//
// Unlike the admin console's backend (where every token-issuing route is
// fixed and known ahead of time), several org auth routes return a *mixed*
// payload — e.g. POST /auth/register/invite returns {message, role,
// requiresApp} and only SOMETIMES also access_token/refresh_token,
// depending on the invited role. So instead of an explicit allowlist of
// "token routes", the proxy just checks every response for an
// access_token field and treats that as the signal: strip the token
// fields into cookies, pass the rest of the body through unchanged.

export const ACCESS_COOKIE = "wellstaq_access_token";
export const REFRESH_COOKIE = "wellstaq_refresh_token";
/** Non-secret marker so middleware can tell a session exists while the access token is being refreshed. */
export const SESSION_MARKER_COOKIE = "wellstaq_signed_in";
export const REFRESH_COOKIE_PATH = "/api/backend";
export const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
/** Fallback only — the real expiry comes from the token response's expires_in. */
export const DEFAULT_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24;

export const PUBLIC_ROUTES = new Set([
  "auth/login",
  "auth/login/google",
  "auth/login/apple",
  "auth/refresh",
  "auth/signup",
  "auth/signup/otp/request",
  "auth/signup/otp/verify",
  "auth/signup/check/business-name",
  "auth/signup/check/phone",
  "auth/invite/otp/request",
  "auth/invite/otp/verify",
  "auth/register/invite",
  "auth/forgot-password",
  "auth/reset-password",
  "auth/2fa/verify",
  "public/demo-requests",
]);

const SEGMENT = /^[a-zA-Z0-9._~-]+$/;

export function isValidPath(segments: string[]): boolean {
  return segments.length > 0 && segments.length <= 8 && segments.every((segment) => SEGMENT.test(segment) && segment !== "." && segment !== "..");
}

export function upstreamUrl(backendUrl: string, segments: string[], search: string): string {
  const base = backendUrl.replace(/\/+$/, "");
  return `${base}/${segments.map(encodeURIComponent).join("/")}${search}`;
}

/** Mutations must come from this origin. Browsers always send Origin on cross-site POSTs. */
export function isSameOriginMutation(method: string, origin: string | null, expectedOrigin: string): boolean {
  if (method === "GET" || method === "HEAD") return true;
  return origin === expectedOrigin;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

/** Reads a snake_case token response. Returns null when the body carries no access_token. */
export function readIssuedTokens(body: unknown): IssuedTokens | null {
  const payload = (body as { data?: unknown } | null)?.data ?? body;
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.access_token !== "string" || !record.access_token) return null;
  const expiresIn = Number(record.expires_in);
  return {
    accessToken: record.access_token,
    refreshToken: typeof record.refresh_token === "string" && record.refresh_token ? record.refresh_token : null,
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? Math.min(expiresIn, 60 * 60 * 4) : DEFAULT_ACCESS_MAX_AGE_SECONDS,
  };
}

/** Removes token fields so tokens never reach browser JavaScript, keeping every other field
 * intact (e.g. register/invite's message/role/requiresApp, or a 2FA challenge's own token). */
export function stripTokens(body: unknown): unknown {
  const payload = (body as { data?: unknown } | null)?.data ?? body;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (!/token/i.test(key) || key === "two_fa_challenge_token" || key === "email_verification_token" || key === "invite_verification_token") {
      safe[key] = value;
    }
  }
  return safe;
}
