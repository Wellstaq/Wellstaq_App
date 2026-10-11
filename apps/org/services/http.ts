// path: services/http.ts
import type { ApiErrorBody, ApiResponse, FastApiValidationItem } from "@/types/api";
import { getApiErrorMessage, getFieldErrorMessage, getFriendlyFieldErrors, getRequestErrorMessage } from "@/lib/errors";

const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors?: Record<string, string[]>,
    public readonly rawMessage?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function extractFieldErrors(body: ApiErrorBody): Record<string, string[]> | undefined {
  const directErrors = getFriendlyFieldErrors(body.fieldErrors);
  if (!Array.isArray(body.detail)) return directErrors;
  const fieldErrors: Record<string, string[]> = {};
  for (const item of body.detail as FastApiValidationItem[]) {
    if (!item || !Array.isArray(item.loc)) continue;
    const parts = item.loc.filter((p) => p !== "body" && p !== "query" && p !== "path");
    const field = String(parts[parts.length - 1] ?? "form");
    (fieldErrors[field] ??= []).push(getFieldErrorMessage(item.msg, field));
  }
  return Object.keys(fieldErrors).length > 0 ? { ...directErrors, ...fieldErrors } : directErrors;
}

function extractMessage(body: ApiErrorBody, status: number): string {
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail) && body.detail.length > 0) {
    return (body.detail[0] as FastApiValidationItem).msg || `Request failed with status ${status}`;
  }
  return body.message || `Request failed with status ${status}`;
}

function notify(error: ApiError) {
  if (error.fieldErrors) return;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("wellstaq:api-error", {
        detail: { message: error.message, status: error.status, code: error.code },
      }),
    );
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  errorMessage?: string;
  timeoutMs?: number;
  suppressErrorNotification?: boolean;
}

function requestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof File);
}

function toSnakeCase(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(toSnakeCase);
  if (isPlainObject(input)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        toSnakeCase(value),
      ]),
    );
  }
  return input;
}

function toCamelCase(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(toCamelCase);
  if (isPlainObject(input)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase()),
        toCamelCase(value),
      ]),
    );
  }
  return input;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    body: requestBody,
    errorMessage,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    suppressErrorNotification = false,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Request-Id", headers.get("X-Request-Id") ?? requestId());

  const method = (fetchOptions.method ?? "GET").toUpperCase();

  let body: BodyInit | undefined;
  if (requestBody instanceof FormData) {
    body = requestBody;
  } else if (requestBody !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(toSnakeCase(requestBody));
  }

  try {
    const response = await fetch(path, {
      ...fetchOptions,
      body,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });

    // The BFF proxy (app/api/backend/[...path]/route.ts) already retries
    // once against a fresh access token using the httpOnly refresh cookie
    // before ever answering 401 — so a 401 here means the session is truly
    // gone, not just an expired access token.
    if (response.status === 401 && !path.includes("/auth/") && typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login?error=session_revoked");
    }

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    // Read the body as text first and only parse it when there is something to
    // parse. Every DELETE in this API answers 204 with no body, and a 204 can
    // still carry a JSON content-type — calling response.json() on that throws,
    // which used to report a successful delete as a failure.
    let rawText: string;
    let rawPayload: unknown;
    try {
      rawText = await response.text();
      rawPayload = isJson && rawText.trim() ? JSON.parse(rawText) : rawText;
    } catch {
      throw new ApiError(
        getApiErrorMessage(
          response.status,
          "INVALID_RESPONSE",
          "",
          errorMessage ?? getRequestErrorMessage(path, method, response.status),
        ),
        response.status,
        "INVALID_RESPONSE",
      );
    }
    const payload = isJson && rawText.trim() ? toCamelCase(rawPayload) : rawPayload;

    if (!response.ok) {
      const errorBody = (typeof payload === "object" && payload ? payload : {}) as ApiErrorBody;
      const rawMessage = extractMessage(errorBody, response.status);
      const requestMessage = errorMessage ?? getRequestErrorMessage(path, method, response.status);
      throw new ApiError(
        getApiErrorMessage(response.status, errorBody.code, rawMessage, requestMessage),
        response.status,
        errorBody.code,
        extractFieldErrors(errorBody),
        rawMessage,
      );
    }

    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as ApiResponse<T>).data;
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      // Read permissions are rendered in the relevant card/page section. Keep
      // global notifications for user-triggered mutations only.
      if (!suppressErrorNotification && !(error.status === 403 && (method === "GET" || method === "HEAD"))) {
        notify(error);
      }
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      const apiError = new ApiError(errorMessage ?? getRequestErrorMessage(path, method, 408), 408, "REQUEST_TIMEOUT");
      if (!suppressErrorNotification) notify(apiError);
      throw apiError;
    }
    const apiError = new ApiError(errorMessage ?? getRequestErrorMessage(path, method, 0), 0, "NETWORK_ERROR");
    if (!suppressErrorNotification) notify(apiError);
    throw apiError;
  } finally {
    clearTimeout(timeout);
  }
}
