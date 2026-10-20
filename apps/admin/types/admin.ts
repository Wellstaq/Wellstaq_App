// Client-side (camelCase) shapes of the admin API. The wire format is
// snake_case; services/http.ts converts in both directions. Field-by-field
// documentation lives in docs/ADMIN_API_CONTRACT.md.
//
// Privacy boundary: none of these types carry wellbeing scores, pulse
// responses, check-ins, event participant identities, or message content.
// Do not add such fields here; the admin console must never request them.

export interface Paginated<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface ListParams {
  q?: string;
  status?: string;
  sort?: string;
  offset?: number;
  limit?: number;
}

export type AdminRole = "super_admin" | "admin" | "support";

export type AdminPermission =
  | "organizations.read"
  | "organizations.manage"
  | "individuals.read"
  | "individuals.manage"
  | "events.read"
  | "events.manage"
  | "support.read"
  | "support.manage"
  | "admins.manage"
  | "audit.read";

export interface AdminMe {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: AdminPermission[];
  avatarUrl: string | null;
  twoFaEnabled: boolean;
}

export type LoginResult =
  | { authenticated: true }
  | { twoFaRequired: true; twoFaChallengeToken: string; twoFaMethod: "totp" | "email" };

export interface PlatformOverview {
  organizations: { total: number; active: number; suspended: number; newThisMonth: number };
  employees: { total: number };
  individuals: { total: number; active: number; newThisMonth: number };
  platformEvents: { upcoming: number; total: number };
  support: { open: number };
  /** One entry per day for the last 30 days, oldest first. Optional until the backend ships it. */
  signupTrend?: SignupTrendPoint[];
}

export interface SignupTrendPoint {
  date: string;
  organizations: number;
  individuals: number;
  employees: number;
}

export type OrganizationStatus = "active" | "suspended" | "pending_setup";

export interface OrganizationOwner {
  name: string;
  email: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  country: string | null;
  status: OrganizationStatus;
  workModel: string | null;
  employeeCount: number;
  branchCount: number;
  planName: string | null;
  subscriptionStatus: string | null;
  /** Free platform access, bypassing payment — granted/revoked from the org detail page. */
  platformComped: boolean;
  owner: OrganizationOwner | null;
  createdAt: string;
}

export interface OrganizationDetail extends OrganizationSummary {
  businessEmail: string | null;
  phoneNumber: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  sizeRange: string | null;
  counts: {
    branches: number;
    departments: number;
    clubs: number;
    events: number;
    employees: number;
  };
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export type AccountStatus = "active" | "invited" | "suspended" | "deactivated" | "pending_verification";

export interface OrganizationMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  branchName: string | null;
  departmentName: string | null;
  role: string | null;
  status: AccountStatus;
  joinedAt: string | null;
  isOwner: boolean;
}

/** A cross-organization match from GET /app-admin/users/search. */
export interface UserSearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  status: AccountStatus;
  organizationId: string;
  organizationName: string | null;
  joinedAt: string | null;
  isOwner: boolean;
}

/** A row from GET /app-admin/organizations/{id}/transactions or /app-admin/payments/search. */
export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  isRecurring: boolean;
  externalReference: string | null;
  failureReason: string | null;
  createdAt: string;
  /** Present only on the cross-organization search response. */
  organizationId?: string;
  organizationName?: string | null;
}

/** A row from GET /app-admin/plans — the platform's plan catalogue. */
export interface SubscriptionPlan {
  id: string;
  name: string;
  billingInterval: string;
  amount: number;
  currency: string;
}

export interface OrganizationBranch {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  memberCount: number;
  managerName: string | null;
}

export interface OrganizationDepartment {
  id: string;
  name: string;
  branchName: string | null;
  memberCount: number;
  headName: string | null;
}

export interface OrganizationClub {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  branchName: string | null;
  memberCount: number;
  createdAt: string;
}

export type EventStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface OrganizationEvent {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  time: string;
  status: EventStatus;
  branchName: string | null;
  participantCount: number;
  createdAt: string;
}

export type IndividualStatus = "active" | "suspended" | "pending_verification";
export type SignupMethod = "email" | "google" | "apple";

export interface Individual {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  country: string | null;
  status: IndividualStatus;
  signupMethod: SignupMethod;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  suspensionReason: string | null;
}

export type EventAudience = "everyone" | "individuals" | "employees" | "selected_organizations";

export interface PlatformEvent {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  time: string;
  timezone: string;
  recurrenceRule: string | null;
  status: EventStatus;
  audience: EventAudience;
  organizations: { id: string; name: string }[];
  participantCount: number;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PlatformEventInput {
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  time: string;
  timezone: string;
  audience: EventAudience;
  organizationIds: string[];
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

/** Matches the live TicketAdminItem schema in the backend OpenAPI spec. */
export interface SupportTicket {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
}

export interface SupportTicketList {
  items: SupportTicket[];
  total: number;
}

export type AdminUserStatus = "active" | "invited" | "disabled";

export interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  twoFaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type AuditTargetType = "organization" | "user" | "event" | "admin" | "support_ticket";

export interface AuditEntry {
  id: string;
  actor: { id: string; name: string; email: string };
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  targetLabel: string;
  reason: string | null;
  createdAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  mediaUrl: string;
}
