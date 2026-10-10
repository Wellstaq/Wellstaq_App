// path: services/auth-token.ts
//
// Tokens themselves never live here (or anywhere in browser JS) — the BFF
// proxy (app/api/backend/[...path]/route.ts) stores them as httpOnly
// cookies and the browser never sees the raw values. This file now only
// holds a same-tab in-memory cache of the current user, to avoid an extra
// GET /auth/me round trip right after login/onboarding/invite-accept
// already returned it.
import type { CurrentUserResponse } from "@/types/api";

let cachedCurrentUser: CurrentUserResponse | null = null;

export function cacheCurrentUser(user: CurrentUserResponse) {
  cachedCurrentUser = user;
}

export function getCachedCurrentUser() {
  return cachedCurrentUser;
}

export function clearCachedCurrentUser() {
  cachedCurrentUser = null;
}
