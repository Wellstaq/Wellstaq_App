// Rules for the same-origin admin proxy (app/api/admin/[...path]/route.ts).
// Kept dependency-free so they can be unit tested without Next.js.

export const ACCESS_COOKIE = "wellstaq_admin_access";
export const REFRESH_COOKIE = "wellstaq_admin_refresh";
/** Non-secret marker so middleware can tell a session exists while the access token is being refreshed. */
export const SESSION_MARKER_COOKIE = "wellstaq_admin_signed_in";
export const REFRESH_COOKIE_PATH = "/api/admin";
export const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 12;

/** The backend namespace every admin request is forced into. */
export const UPSTREAM_PREFIX = "app-admin";

export const PUBLIC_ROUTES = new Set([
  "auth/login",
  "auth/2fa/verify",
  "auth/refresh",
  "auth/password/forgot",
  "auth/password/reset",
]);

export const TOKEN_ISSUING_ROUTES = new Set(["auth/login", "auth/2fa/verify", "auth/refresh"]);

/** Interim routes guarded by the backend's static x-app-admin-key header. */
export const ADMIN_KEY_ROUTES = [/^support\/tickets(\/[^/]+)?$/];

const SEGMENT = /^[a-zA-Z0-9._~-]+$/;

export function isValidPath(segments: string[]): boolean {
  return segments.length > 0 && segments.length <= 8 && segments.every((segment) => SEGMENT.test(segment) && segment !== "." && segment !== "..");
}

export function upstreamUrl(backendUrl: string, segments: string[], search: string): string {
  const base = backendUrl.replace(/\/+$/, "");
  return `${base}/${UPSTREAM_PREFIX}/${segments.map(encodeURIComponent).join("/")}${search}`;
}

export function needsAdminKey(routePath: string): boolean {
  return ADMIN_KEY_ROUTES.some((pattern) => pattern.test(routePath));
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

/** Reads a snake_case token response. Returns null when the body is not a token response. */
export function readIssuedTokens(body: unknown): IssuedTokens | null {
  const payload = (body as { data?: unknown } | null)?.data ?? body;
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.access_token !== "string" || !record.access_token) return null;
  const expiresIn = Number(record.expires_in);
  return {
    accessToken: record.access_token,
    refreshToken: typeof record.refresh_token === "string" && record.refresh_token ? record.refresh_token : null,
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? Math.min(expiresIn, 60 * 60 * 4) : 15 * 60,
  };
}

/** Removes every token field so tokens never reach browser JavaScript. */
export function stripTokens(body: unknown): Record<string, unknown> {
  const payload = (body as { data?: unknown } | null)?.data ?? body;
  if (!payload || typeof payload !== "object") return {};
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (!/token/i.test(key) || key === "two_fa_challenge_token") safe[key] = value;
  }
  return safe;
}
