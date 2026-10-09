// Local preview mode (ADMIN_PREVIEW_MODE=true, development only).
// Lets designers walk every screen before the admin API exists: lists come
// back empty, counts are zero, details are "not found" and every write is
// refused. It never invents records.

export interface PreviewResponse {
  status: number;
  body: unknown;
}

const ALL_PERMISSIONS = [
  "organizations.read",
  "organizations.manage",
  "individuals.read",
  "individuals.manage",
  "events.read",
  "events.manage",
  "support.read",
  "support.manage",
  "admins.manage",
  "audit.read",
];

const LIST_ROUTES = [
  /^organizations$/,
  /^organizations\/[^/]+\/(members|branches|departments|clubs|events)$/,
  /^individuals$/,
  /^events$/,
  /^admins$/,
  /^audit-log$/,
];

const DETAIL_ROUTES = [/^organizations\/[^/]+$/, /^individuals\/[^/]+$/, /^events\/[^/]+$/];

export function isPreviewEnabled(env: Record<string, string | undefined>): boolean {
  return env.ADMIN_PREVIEW_MODE === "true" && env.NODE_ENV !== "production";
}

export function previewResponse(method: string, routePath: string, search: URLSearchParams): PreviewResponse {
  if (method !== "GET") {
    return {
      status: 503,
      body: { code: "PREVIEW_MODE", message: "Preview mode isn't connected to the backend, so changes can't be saved." },
    };
  }
  if (routePath === "auth/me") {
    return {
      status: 200,
      body: {
        id: "preview",
        email: "preview@localhost",
        first_name: "Preview",
        last_name: "Admin",
        role: "super_admin",
        permissions: ALL_PERMISSIONS,
        avatar_url: null,
        two_fa_enabled: false,
        is_preview: true,
      },
    };
  }
  if (routePath === "overview") {
    return {
      status: 200,
      body: {
        organizations: { total: 0, active: 0, suspended: 0, new_this_month: 0 },
        employees: { total: 0 },
        individuals: { total: 0, active: 0, new_this_month: 0 },
        platform_events: { upcoming: 0, total: 0 },
        support: { open: 0 },
      },
    };
  }
  if (routePath === "support/tickets") {
    return { status: 200, body: { items: [], total: 0 } };
  }
  if (LIST_ROUTES.some((pattern) => pattern.test(routePath))) {
    const offset = Number(search.get("offset") ?? 0) || 0;
    const limit = Number(search.get("limit") ?? 20) || 20;
    return { status: 200, body: { items: [], total: 0, offset, limit } };
  }
  if (DETAIL_ROUTES.some((pattern) => pattern.test(routePath))) {
    return { status: 404, body: { code: "NOT_FOUND", message: "Not found in preview mode." } };
  }
  return { status: 404, body: { code: "NOT_FOUND", message: "Unknown admin route." } };
}
