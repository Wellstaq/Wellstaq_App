# Signup data needed by the frontend

Checked the deployed OpenAPI schema on 2026-09-13 (read-only).

- `GET /auth/me` exposes `phone_number`, `first_name`, `last_name`, and `email`. The frontend now reads the phone from this documented endpoint instead of the undocumented `/v1/users/{id}/profile` route.
- `GET /user-settings/profile` exposes `country` and `state`. The frontend loads these directly and no longer clears them when an avatar refresh updates dashboard data. During local testing this request reported a not-found error; backend should verify the deployed route and the signed-in account's profile.
- `GET /organizations/{org_id}/dashboard/bootstrap` now returns `DashboardBootstrapUserResponse`, including `business_name` and `organization_slug`. The frontend's response normalization maps `business_name` to `user.businessName`, which is shown in the dashboard header.
- The organization signup form and `/auth/signup` payload in this checkout do not collect/send country and state. The invited-member registration flow does send both. Please clarify how existing organization accounts' signup location is persisted if it was collected by another version.

No backend code, stored data, or authentication behavior was changed.
