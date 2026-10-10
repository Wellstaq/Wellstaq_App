import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  PUBLIC_ROUTES,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_MARKER_COOKIE,
  TOKEN_ISSUING_ROUTES,
  isSameOriginMutation,
  isValidPath,
  needsAdminKey,
  readIssuedTokens,
  stripTokens,
  upstreamUrl,
  type IssuedTokens,
} from "@/lib/bff";
import { isPreviewEnabled, previewResponse } from "@/lib/preview";

export const dynamic = "force-dynamic";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "x-request-id", "user-agent"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "etag"];
const UPSTREAM_TIMEOUT_MS = 30_000;

type Context = { params: Promise<{ path: string[] }> };

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

function setSessionCookies(response: NextResponse, tokens: IssuedTokens) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: tokens.expiresIn,
  });
  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
    response.cookies.set(SESSION_MARKER_COOKIE, "1", {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { path: REFRESH_COOKIE_PATH, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: REFRESH_COOKIE_PATH, maxAge: 0 });
  response.cookies.set(SESSION_MARKER_COOKIE, "", { path: "/", maxAge: 0 });
}

async function callUpstream(url: string, init: { method: string; headers: Headers; body?: ArrayBuffer }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, cache: "no-store", redirect: "manual", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshSession(backendUrl: string, refreshToken: string): Promise<IssuedTokens | null> {
  const response = await callUpstream(upstreamUrl(backendUrl, ["auth", "refresh"], ""), {
    method: "POST",
    headers: new Headers({ "content-type": "application/json", accept: "application/json" }),
    body: new TextEncoder().encode(JSON.stringify({ refresh_token: refreshToken })).buffer as ArrayBuffer,
  });
  if (!response.ok) return null;
  const tokens = readIssuedTokens(await response.json().catch(() => null));
  return tokens ? { ...tokens, refreshToken: tokens.refreshToken ?? refreshToken } : null;
}

async function proxy(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const method = request.method.toUpperCase();

  if (!ALLOWED_METHODS.has(method)) return json({ message: "Method not allowed" }, 405);
  if (!isValidPath(path)) return json({ message: "Invalid API path", code: "INVALID_PATH" }, 400);
  if (!isSameOriginMutation(method, request.headers.get("origin"), request.nextUrl.origin)) {
    return json({ message: "Cross-origin request blocked", code: "CROSS_ORIGIN" }, 403);
  }

  const routePath = path.join("/");

  if (isPreviewEnabled(process.env)) {
    const preview = previewResponse(method, routePath, request.nextUrl.searchParams);
    return json(preview.body, preview.status);
  }

  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) return json({ message: "The admin API isn't configured.", code: "API_NOT_CONFIGURED" }, 503);

  const isPublic = PUBLIC_ROUTES.has(routePath);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let refreshedTokens: IssuedTokens | null = null;

  if (routePath === "auth/refresh") {
    if (!refreshToken) return json({ message: "Session expired", code: "SESSION_EXPIRED" }, 401);
    refreshedTokens = await refreshSession(backendUrl, refreshToken).catch(() => null);
    const response = refreshedTokens ? json({ authenticated: true }, 200) : json({ message: "Session expired", code: "SESSION_EXPIRED" }, 401);
    if (refreshedTokens) setSessionCookies(response, refreshedTokens);
    else clearSessionCookies(response);
    return response;
  }

  if (!isPublic && !accessToken && refreshToken) {
    refreshedTokens = await refreshSession(backendUrl, refreshToken).catch(() => null);
    accessToken = refreshedTokens?.accessToken;
  }
  if (!isPublic && !accessToken) {
    const response = json({ message: "Your session has ended. Sign in again.", code: "UNAUTHENTICATED" }, 401);
    clearSessionCookies(response);
    return response;
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!isPublic && accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  if (needsAdminKey(routePath) && process.env.APP_ADMIN_API_KEY) {
    headers.set("x-app-admin-key", process.env.APP_ADMIN_API_KEY);
  }

  const body = method === "GET" ? undefined : await request.arrayBuffer();
  const target = upstreamUrl(backendUrl, path, request.nextUrl.search);

  try {
    let upstream = await callUpstream(target, { method, headers, body });

    if (upstream.status === 401 && !isPublic && refreshToken && !refreshedTokens) {
      refreshedTokens = await refreshSession(backendUrl, refreshToken).catch(() => null);
      if (refreshedTokens) {
        headers.set("authorization", `Bearer ${refreshedTokens.accessToken}`);
        upstream = await callUpstream(target, { method, headers, body });
      }
    }

    if (upstream.ok && TOKEN_ISSUING_ROUTES.has(routePath)) {
      const payload = await upstream.json().catch(() => null);
      const tokens = readIssuedTokens(payload);
      const response = json(tokens ? { authenticated: true } : stripTokens(payload), upstream.status);
      if (tokens) setSessionCookies(response, tokens);
      return response;
    }

    const responseHeaders = new Headers({ "cache-control": "no-store" });
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const response = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: responseHeaders });

    if (routePath === "auth/logout" || (upstream.status === 401 && !isPublic)) {
      clearSessionCookies(response);
    } else if (refreshedTokens) {
      setSessionCookies(response, refreshedTokens);
    }
    return response;
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    if (routePath === "auth/logout") {
      const response = json({ loggedOut: true }, 200);
      clearSessionCookies(response);
      return response;
    }
    return json(
      {
        message: timedOut ? "The admin API took too long to respond." : "The admin API is unavailable right now.",
        code: timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      },
      timedOut ? 504 : 502,
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
