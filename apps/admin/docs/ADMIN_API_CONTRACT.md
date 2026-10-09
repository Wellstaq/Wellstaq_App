# Admin API contract (backend handoff)

This is what the Wellstaq admin console (`apps/admin`, served at `admin.wellstaq.com`) expects from the backend. The frontend is built and tested against exactly these shapes. Every screen already handles loading, empty and error states, so endpoints can ship one at a time and each screen lights up as its endpoint goes live.

The TypeScript source of truth is [`apps/admin/types/admin.ts`](../types/admin.ts) (camelCase there; snake_case on the wire), and every call is in [`apps/admin/services/admin-api.ts`](../services/admin-api.ts).

## 1. Ground rules

| Rule | Detail |
| --- | --- |
| Namespace | Every admin endpoint lives under `/app-admin/...`, next to the existing `/app-admin/support/tickets`. The console's server-side proxy can only call that prefix. |
| Separate identities | Admins are Wellstaq staff, not organization users. Use a separate admin account table (or a hard flag), separate tokens, and reject organization tokens on `/app-admin/*`. |
| Wire format | JSON, snake_case keys, ISO 8601 UTC timestamps (`2026-10-09T08:00:00Z`), calendar dates as `YYYY-MM-DD`, times as `HH:MM` or `HH:MM:SS`. |
| Lists | `GET` lists accept `offset`, `limit` (max 100), `q` (free-text search), `status`, `sort` (field name, `-` prefix for descending) and return `{ "items": [], "total": 0, "offset": 0, "limit": 20 }`. Unknown filter values return an empty list, not an error. |
| Errors | FastAPI style. `{ "detail": "Human readable message" }`, or for validation `{ "detail": [{ "loc": ["body", "title"], "msg": "..." }] }`. The console shows field errors next to the matching field. Optional `code` string. |
| Writes | `POST` / `PATCH` return the updated resource unless noted. `DELETE` and pure actions may return `204 No Content`. |
| Authorization | Enforce role permissions on every endpoint (section 3). The console hides what a role can't do, but that's cosmetic only. |
| Audit | Every write creates an audit entry (section 10). |

## 2. Privacy boundary (must hold server side)

The admin console must **never receive** the data below. Leave these fields out of every `/app-admin` response. Don't just rely on the UI not showing them, because anything in a response can be read in browser dev tools.

- Wellbeing scores, assessments, baselines, dimension or category scores, at any level (person, department, branch, organization)
- Pulse survey responses, pulse history, check-ins, streaks, engagement logs, activity logs
- Event participant identities (who joined, was invited, attended). **Counts are fine.**
- Messages or chat content of any kind (event chat, club chat, posts, comments, stories)
- Club member lists (counts are fine)
- Personal health or wellness priorities, opted-in wellbeing challenges

The console never calls any non-`/app-admin` endpoint, so the existing organization endpoints don't need to change for this.

## 3. Roles and permissions

`GET /app-admin/auth/me` returns the admin's `role` and `permissions`. `super_admin` implicitly has every permission.

| Permission | super_admin | admin | support |
| --- | :-: | :-: | :-: |
| `organizations.read` | yes | yes | yes |
| `organizations.manage` (suspend, reactivate, employee account actions) | yes | yes | no |
| `individuals.read` | yes | yes | yes |
| `individuals.manage` | yes | yes | no |
| `events.read` | yes | yes | yes |
| `events.manage` | yes | yes | no |
| `support.read` | yes | yes | yes |
| `support.manage` | yes | yes | yes |
| `admins.manage` | yes | no | no |
| `audit.read` | yes | yes | no |

Suggested defaults only; the backend owns the mapping. Return `403` when a permission is missing.

## 4. Authentication

The browser never sees tokens. The console's proxy (`app/api/admin/[...path]/route.ts`) calls these endpoints server-to-server and stores tokens in httpOnly, SameSite=Strict cookies on `admin.wellstaq.com`. No CORS setup is needed for the admin console.

| Method and path | Body | Success response |
| --- | --- | --- |
| `POST /app-admin/auth/login` | `{ "email", "password" }` | Either tokens (below) or `{ "two_fa_required": true, "two_fa_challenge_token": "...", "two_fa_method": "totp" \| "email" }` |
| `POST /app-admin/auth/2fa/verify` | `{ "challenge_token", "code" }` | Tokens |
| `POST /app-admin/auth/refresh` | `{ "refresh_token" }` | Tokens. Rotate the refresh token if you can. |
| `POST /app-admin/auth/logout` | none (Bearer token) | `204`. Revoke the refresh token. |
| `GET /app-admin/auth/me` | none | `AdminMe` (below) |
| `POST /app-admin/auth/password/forgot` | `{ "email" }` | `204` **whether or not the email exists** |
| `POST /app-admin/auth/password/reset` | `{ "token", "password" }` | `204`. Single-use token. The email link must point to `https://admin.wellstaq.com/reset-password?token=...` |

Token response:

```json
{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "expires_in": 900 }
```

`AdminMe`:

```json
{
  "id": "uuid", "email": "yemi@wellstaq.com", "first_name": "Yemi", "last_name": "Sage",
  "role": "super_admin", "permissions": ["organizations.read"], "avatar_url": null, "two_fa_enabled": true
}
```

Login errors the console reads: `401` wrong credentials, `403` account isn't an admin or is disabled, `423` locked, `429` rate limited.

**Security asks:**
- Require two-step verification for every admin. Invited admins set it up before their first sign-in.
- Short access tokens (the proxy caps cookie life at 4 hours and defaults to 15 minutes), refresh tokens around 12 hours.
- Rate limit login, 2FA and password reset by IP and by account. Lock after repeated failures.
- Optional: an IP allowlist for `/app-admin/*` at the gateway.

**Interim:** `/app-admin/support/tickets` currently uses a static `x-app-admin-key` header. The proxy attaches it from the server-only `APP_ADMIN_API_KEY` variable; it never reaches the browser. Once admin login exists, please switch that endpoint to admin Bearer auth and retire the key.

## 5. Overview

`GET /app-admin/overview`

```json
{
  "organizations": { "total": 0, "active": 0, "suspended": 0, "new_this_month": 0 },
  "employees": { "total": 0 },
  "individuals": { "total": 0, "active": 0, "new_this_month": 0 },
  "platform_events": { "upcoming": 0, "total": 0 },
  "support": { "open": 0 }
}
```

## 6. Organizations

### `GET /app-admin/organizations`

Filters: `q` (name or owner email), `status` (`active`, `suspended`, `pending_setup`), `sort` (`-created_at`, `name`, `-employee_count`). Item:

```json
{
  "id": "uuid", "name": "Kora Logistics", "logo_url": null, "industry": "logistics", "country": "Nigeria",
  "status": "active", "work_model": "hybrid", "employee_count": 412, "branch_count": 3,
  "plan_name": "Growth", "subscription_status": "active",
  "owner": { "name": "Adaeze Okafor", "email": "adaeze@example.com" },
  "created_at": "2026-09-28T10:12:00Z"
}
```

### `GET /app-admin/organizations/{org_id}`

The list item plus:

```json
{
  "business_email": null, "phone_number": null, "website": null, "address": null, "city": null, "state": null,
  "size_range": "201-500",
  "counts": { "branches": 3, "departments": 6, "clubs": 4, "events": 19, "employees": 412 },
  "suspended_at": null, "suspension_reason": null
}
```

### `POST /app-admin/organizations/{org_id}/suspend`

Body `{ "reason": "at least 10 characters" }`. Returns the updated detail. Expected effect: every member of the organization is signed out and can't sign in until reactivated; no data is deleted.

### `POST /app-admin/organizations/{org_id}/reactivate`

Returns the updated detail.

### Organization collections (all paginated, all support `q`)

| Endpoint | Item fields |
| --- | --- |
| `GET /app-admin/organizations/{org_id}/members` (also `status`: `active`, `invited`, `suspended`, `deactivated`) | `id, first_name, last_name, email, avatar_url, branch_name, department_name, role, status, joined_at` |
| `GET /app-admin/organizations/{org_id}/branches` | `id, name, city, country, member_count, manager_name` |
| `GET /app-admin/organizations/{org_id}/departments` | `id, name, branch_name, member_count, head_name` |
| `GET /app-admin/organizations/{org_id}/clubs` | `id, name, description, image_url, branch_name, member_count, created_at` |
| `GET /app-admin/organizations/{org_id}/events` (also `status`, `sort=-start_date`) | `id, title, description, image_url, start_date, end_date, time, status, branch_name, participant_count, created_at` |

Per section 2: no participant lists, no member lists for clubs, no chat.

## 7. User account actions

Shared by organization employees and individual users. All return `204`.

| Endpoint | Body | Effect |
| --- | --- | --- |
| `POST /app-admin/users/{user_id}/suspend` | `{ "reason" }` | Revoke all sessions; block sign-in. Keep data. |
| `POST /app-admin/users/{user_id}/reactivate` | none | Allow sign-in again. |
| `POST /app-admin/users/{user_id}/password-reset` | none | Email the user the normal reset link. The current password keeps working until they change it. |

## 8. Individual users (B2C)

People with no organization. `GET /app-admin/individuals` (filters `q`, `status`: `active`, `suspended`, `pending_verification`; `sort=-created_at`) and `GET /app-admin/individuals/{user_id}`:

```json
{
  "id": "uuid", "first_name": "Amara", "last_name": "Obi", "email": "amara@example.com", "avatar_url": null,
  "country": "Nigeria", "status": "active", "signup_method": "google", "email_verified": true,
  "created_at": "2026-10-05T00:00:00Z", "last_login_at": "2026-10-09T07:14:00Z", "suspension_reason": null
}
```

`signup_method` is `email`, `google` or `apple`.

## 9. Platform events

Events created by Wellstaq staff. They follow the same model as organization events (`title, description, image_url, start_date, end_date, recurrence_rule, time, status`) plus a time zone and an audience.

| Method and path | Notes |
| --- | --- |
| `GET /app-admin/events` | Filters `q`, `status` (`scheduled`, `ongoing`, `completed`, `cancelled`), `audience`, `sort` (`start_date`, `-start_date`) |
| `POST /app-admin/events` | Body below. Returns `201` with the event. |
| `GET /app-admin/events/{event_id}` | |
| `PATCH /app-admin/events/{event_id}` | Any subset of the body fields |
| `POST /app-admin/events/{event_id}/cancel` | Sets `status` to `cancelled`, notifies people who joined. Returns the event. |
| `DELETE /app-admin/events/{event_id}` | Hard delete, `204` |
| `POST /app-admin/storage/upload-url` | `{ "domain": "events", "content_type": "image/png" }` returns `{ "upload_url", "media_url" }`. Same flow as the existing `/storage/upload-url`: the browser `PUT`s the file to `upload_url`, then sends `media_url` as `image_url`. |

Create body:

```json
{
  "title": "Sleep better in 21 days", "description": null, "image_url": null,
  "start_date": "2026-10-22", "end_date": null, "time": "17:30", "timezone": "Africa/Lagos",
  "audience": "everyone", "organization_ids": []
}
```

`audience` values:

| Value | Who sees it |
| --- | --- |
| `everyone` | Individual users and employees of every active organization |
| `individuals` | Individual users only |
| `employees` | Employees of every active organization |
| `selected_organizations` | Employees of the organizations in `organization_ids` (at least one) |

Event response: the create body fields plus `id, recurrence_rule, status, participant_count, created_by: { id, name } | null, created_at, updated_at`, and `organizations: [{ id, name }]` in place of `organization_ids`. Validation the console already applies: title required (max 120), description max 2000, end date not before start date, at least one organization for `selected_organizations`.

### Showing platform events to users

For these events to reach dashboards, the user-facing API also needs read access. Proposed:

- `GET /platform-events` for any signed-in employee or individual user returns the platform events whose audience includes them (same item shape as organization events, plus `timezone`).
- `POST` / `DELETE /platform-events/{event_id}/join` to join and leave.

The employee app (`yemiSage/Wellstaq_Employee`) and the future B2C app will need frontend work to list these next to organization events. That's tracked separately from the admin console.

## 10. Support tickets (already live)

Uses the existing endpoints unchanged: `GET /app-admin/support/tickets?status_filter=&offset=&limit=` returning `{ items, total }` and `PATCH /app-admin/support/tickets/{ticket_id}` with `{ "status": "open" | "in_progress" | "resolved" | "closed" }`. The only addition needed is the open-ticket count in `GET /app-admin/overview` (`support.open`).

## 11. Admin team

| Method and path | Body | Response |
| --- | --- | --- |
| `GET /app-admin/admins` | | Paginated `{ id, first_name, last_name, email, role, status, two_fa_enabled, last_login_at, created_at }`. `status` is `active`, `invited` or `disabled`. |
| `POST /app-admin/admins/invite` | `{ "email", "role" }` | The new admin (`status: invited`). `409` if the email is already an admin. Sends an invite email. |
| `PATCH /app-admin/admins/{admin_id}` | `{ "role" }` | The updated admin |
| `DELETE /app-admin/admins/{admin_id}` | | `204`. Revoke their sessions. |

Guard rails: admins can't change their own role or remove themselves, and the last `super_admin` can't be demoted or removed.

## 12. Audit log

`GET /app-admin/audit-log` (filters `q` for admin name or record label, `target_type`; newest first). Entries are append-only:

```json
{
  "id": "uuid",
  "actor": { "id": "uuid", "name": "Yemi Sage", "email": "yemi@wellstaq.com" },
  "action": "organization.suspended",
  "target_type": "organization",
  "target_id": "uuid",
  "target_label": "Brightwater Clinics",
  "reason": "Unpaid invoice for August and September.",
  "created_at": "2026-10-01T11:20:00Z"
}
```

`target_type` is `organization`, `user`, `event`, `admin` or `support_ticket`. Please record at least: sign-ins (success and failure), organization and user suspend or reactivate, password reset sends, platform event create, update, cancel and delete, admin invite, role change and removal, and support ticket status changes. Also store the IP address and user agent server side; the console doesn't display them yet.

## 13. Open questions for the backend

1. Should suspending an organization also pause billing, or is that a separate action?
2. Can an individual user later join an organization, and if so, do they move from Individuals to that organization's Employees?
3. Do platform events need recurrence (`recurrence_rule`) in the first version? The console sends and displays it, but has no editor for it yet.
4. Should `participant_count` on organization events be visible to admins? It's an aggregate, so the console shows it. Say if it should be hidden.
