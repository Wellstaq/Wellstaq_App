import { toCamelCase, toSnakeCase } from "@/lib/case";

const BFF_BASE = "/api/admin";
const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isForbidden() {
    return this.status === 403;
  }
}

interface ValidationItem {
  loc?: (string | number)[];
  msg?: string;
}

function friendlyMessage(status: number, fallback?: string): string {
  if (status === 0) return "We couldn't reach Wellstaq. Check your connection and try again.";
  if (status === 401) return "Your session has ended. Sign in again.";
  if (status === 403) return "Your admin role doesn't allow this action.";
  if (status === 404) return "We couldn't find that record. It may have been removed.";
  if (status === 408 || status === 504) return "The request took too long. Try again.";
  if (status === 409) return fallback ?? "This record changed while you were editing it. Reload and try again.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  if (status >= 500) return fallback && status === 503 ? fallback : "Something went wrong on our side. Try again shortly.";
  return fallback ?? "We couldn't complete that request.";
}

function parseError(status: number, payload: unknown): ApiError {
  const body = (payload && typeof payload === "object" ? payload : {}) as { detail?: unknown; message?: unknown; code?: unknown };
  const code = typeof body.code === "string" ? body.code : undefined;
  let fieldErrors: Record<string, string> | undefined;
  let serverMessage = typeof body.message === "string" ? body.message : undefined;

  if (typeof body.detail === "string") serverMessage = body.detail;
  if (Array.isArray(body.detail)) {
    fieldErrors = {};
    for (const item of body.detail as ValidationItem[]) {
      const field = String(item.loc?.filter((part) => part !== "body" && part !== "query" && part !== "path").at(-1) ?? "form");
      const camelField = field.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
      fieldErrors[camelField] ??= item.msg ?? "Check this field.";
    }
  }

  return new ApiError(friendlyMessage(status, serverMessage), status, code, fieldErrors && Object.keys(fieldErrors).length ? fieldErrors : undefined);
}

function announce(error: ApiError) {
  if (typeof window === "undefined" || error.fieldErrors) return;
  window.dispatchEvent(new CustomEvent("wellstaq-admin:api-error", { detail: { message: error.message, status: error.status, code: error.code } }));
}

function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}&reason=expired`);
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Reads render their own inline error state, so only writes toast by default. */
  notify?: boolean;
  /** Login screens handle 401 themselves instead of redirecting. */
  redirectOnUnauthorized?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const notify = options.notify ?? method !== "GET";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });

  const headers = new Headers({ accept: "application/json", "x-request-id": globalThis.crypto?.randomUUID?.() ?? String(Date.now()) });
  let body: string | undefined;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(toSnakeCase(options.body));
  }

  try {
    const response = await fetch(`${BFF_BASE}${path}`, {
      method,
      headers,
      body,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
    let payload: unknown = null;
    if (isJson && text.trim()) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new ApiError("The server sent a response we couldn't read.", response.status, "INVALID_RESPONSE");
      }
    }

    if (!response.ok) {
      const error = parseError(response.status, payload);
      if (response.status === 401 && options.redirectOnUnauthorized !== false) redirectToLogin();
      else if (notify) announce(error);
      throw error;
    }

    const data = payload && typeof payload === "object" && "data" in payload ? (payload as { data: unknown }).data : payload;
    return toCamelCase(data) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw error;
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    const apiError = new ApiError(friendlyMessage(timedOut ? 408 : 0), timedOut ? 408 : 0, timedOut ? "REQUEST_TIMEOUT" : "NETWORK_ERROR");
    if (notify) announce(apiError);
    throw apiError;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
