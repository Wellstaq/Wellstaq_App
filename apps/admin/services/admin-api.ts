import { toQueryString } from "@/lib/case";
import { request } from "@/services/http";
import type {
  AdminMe,
  AdminRole,
  AdminUser,
  AuditEntry,
  Individual,
  ListParams,
  LoginResult,
  OrganizationBranch,
  OrganizationClub,
  OrganizationDepartment,
  OrganizationDetail,
  OrganizationEvent,
  OrganizationMember,
  OrganizationSummary,
  Paginated,
  PaymentTransaction,
  PlatformEvent,
  PlatformEventInput,
  PlatformOverview,
  SubscriptionPlan,
  SupportTicket,
  SupportTicketList,
  TicketStatus,
  UploadUrlResponse,
  UserSearchResult,
} from "@/types/admin";

// Every path below is relative to the backend's /app-admin namespace.
// The BFF prefixes it; the browser can't reach any other backend route.

type Signal = { signal?: AbortSignal };
const id = encodeURIComponent;

export const adminApi = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResult>("/auth/login", { method: "POST", body: { email, password }, redirectOnUnauthorized: false, notify: false }),
    verifyTwoFa: (challengeToken: string, code: string) =>
      request<LoginResult>("/auth/2fa/verify", { method: "POST", body: { challengeToken, code }, redirectOnUnauthorized: false, notify: false }),
    me: ({ signal }: Signal = {}) => request<AdminMe>("/auth/me", { signal }),
    /** Self-service only — always the signed-in admin's own row. */
    updateProfile: (input: { firstName: string; lastName: string; avatarUrl: string | null }) =>
      request<AdminMe>("/auth/me", { method: "PATCH", body: input }),
    logout: () => request<void>("/auth/logout", { method: "POST", redirectOnUnauthorized: false, notify: false }),
    forgotPassword: (email: string) =>
      request<void>("/auth/password/forgot", { method: "POST", body: { email }, redirectOnUnauthorized: false, notify: false }),
    resetPassword: (token: string, password: string) =>
      request<void>("/auth/password/reset", { method: "POST", body: { token, password }, redirectOnUnauthorized: false, notify: false }),
  },

  overview: ({ signal }: Signal = {}) => request<PlatformOverview>("/overview", { signal }),

  organizations: {
    list: (params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<OrganizationSummary>>(`/organizations${toQueryString({ ...params })}`, { signal }),
    get: (orgId: string, { signal }: Signal = {}) => request<OrganizationDetail>(`/organizations/${id(orgId)}`, { signal }),
    suspend: (orgId: string, reason: string) =>
      request<OrganizationDetail>(`/organizations/${id(orgId)}/suspend`, { method: "POST", body: { reason } }),
    reactivate: (orgId: string) => request<OrganizationDetail>(`/organizations/${id(orgId)}/reactivate`, { method: "POST" }),
    /** Flips the organization to free platform access, bypassing payment. */
    comp: (orgId: string) => request<OrganizationDetail>(`/organizations/${id(orgId)}/comp`, { method: "POST" }),
    revokeComp: (orgId: string) => request<OrganizationDetail>(`/organizations/${id(orgId)}/comp/revoke`, { method: "POST" }),
    members: (orgId: string, params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<OrganizationMember>>(`/organizations/${id(orgId)}/members${toQueryString({ ...params })}`, { signal }),
    branches: (orgId: string, params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<OrganizationBranch>>(`/organizations/${id(orgId)}/branches${toQueryString({ ...params })}`, { signal }),
    departments: (orgId: string, params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<OrganizationDepartment>>(`/organizations/${id(orgId)}/departments${toQueryString({ ...params })}`, { signal }),
    clubs: (orgId: string, params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<OrganizationClub>>(`/organizations/${id(orgId)}/clubs${toQueryString({ ...params })}`, { signal }),
    events: (orgId: string, params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<OrganizationEvent>>(`/organizations/${id(orgId)}/events${toQueryString({ ...params })}`, { signal }),
    transactions: (orgId: string, params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<PaymentTransaction>>(`/organizations/${id(orgId)}/transactions${toQueryString({ ...params })}`, { signal }),
    /** Reconciliation tool: marks the org's subscription active on a plan without going through checkout. */
    activateSubscription: (orgId: string, planId: string, reason: string) =>
      request<OrganizationDetail>(`/organizations/${id(orgId)}/subscription/activate`, { method: "POST", body: { planId, reason } }),
    /** Ends access immediately and requires the organization to complete a fresh checkout. */
    cancelSubscription: (orgId: string, reason: string) =>
      request<OrganizationDetail>(`/organizations/${id(orgId)}/subscription/cancel`, { method: "POST", body: { reason } }),
  },

  payments: {
    /** Cross-organization lookup by gateway reference or internal transaction id. */
    search: (params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<PaymentTransaction>>(`/payments/search${toQueryString({ ...params })}`, { signal }),
  },

  plans: {
    list: ({ signal }: Signal = {}) => request<{ items: SubscriptionPlan[] }>("/plans", { signal }),
  },

  /** Account actions shared by organization employees and individual users. */
  users: {
    search: (params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<UserSearchResult>>(`/users/search${toQueryString({ ...params })}`, { signal }),
    suspend: (userId: string, reason: string) => request<void>(`/users/${id(userId)}/suspend`, { method: "POST", body: { reason } }),
    reactivate: (userId: string) => request<void>(`/users/${id(userId)}/reactivate`, { method: "POST" }),
    sendPasswordReset: (userId: string) => request<void>(`/users/${id(userId)}/password-reset`, { method: "POST" }),
  },

  individuals: {
    list: (params: ListParams, { signal }: Signal = {}) =>
      request<Paginated<Individual>>(`/individuals${toQueryString({ ...params })}`, { signal }),
    get: (userId: string, { signal }: Signal = {}) => request<Individual>(`/individuals/${id(userId)}`, { signal }),
  },

  events: {
    list: (params: ListParams & { audience?: string }, { signal }: Signal = {}) =>
      request<Paginated<PlatformEvent>>(`/events${toQueryString({ ...params })}`, { signal }),
    get: (eventId: string, { signal }: Signal = {}) => request<PlatformEvent>(`/events/${id(eventId)}`, { signal }),
    create: (input: PlatformEventInput) => request<PlatformEvent>("/events", { method: "POST", body: input }),
    update: (eventId: string, input: Partial<PlatformEventInput>) =>
      request<PlatformEvent>(`/events/${id(eventId)}`, { method: "PATCH", body: input }),
    cancel: (eventId: string) => request<PlatformEvent>(`/events/${id(eventId)}/cancel`, { method: "POST" }),
    remove: (eventId: string) => request<void>(`/events/${id(eventId)}`, { method: "DELETE" }),
  },

  support: {
    list: (params: { status?: TicketStatus; offset?: number; limit?: number }, { signal }: Signal = {}) =>
      request<SupportTicketList>(`/support/tickets${toQueryString({ statusFilter: params.status, offset: params.offset, limit: params.limit })}`, { signal }),
    updateStatus: (ticketId: string, status: TicketStatus) =>
      request<SupportTicket>(`/support/tickets/${id(ticketId)}`, { method: "PATCH", body: { status } }),
  },

  admins: {
    list: (params: ListParams, { signal }: Signal = {}) => request<Paginated<AdminUser>>(`/admins${toQueryString({ ...params })}`, { signal }),
    invite: (email: string, role: AdminRole) => request<AdminUser>("/admins/invite", { method: "POST", body: { email, role } }),
    updateRole: (adminId: string, role: AdminRole) => request<AdminUser>(`/admins/${id(adminId)}`, { method: "PATCH", body: { role } }),
    remove: (adminId: string) => request<void>(`/admins/${id(adminId)}`, { method: "DELETE" }),
  },

  auditLog: {
    list: (params: ListParams & { targetType?: string; startDate?: string; endDate?: string }, { signal }: Signal = {}) =>
      request<Paginated<AuditEntry>>(`/audit-log${toQueryString({ ...params })}`, { signal }),
  },

  storage: {
    requestUploadUrl: (contentType: string, domain: "admin-avatars" | "platform-events") =>
      request<UploadUrlResponse>("/storage/upload-url", { method: "POST", body: { domain, contentType } }),
  },
};
