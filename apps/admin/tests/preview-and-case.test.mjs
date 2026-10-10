import assert from "node:assert/strict";
import { test } from "node:test";
import { isPreviewEnabled, previewResponse } from "../lib/preview.ts";
import { toCamelCase, toQueryString, toSnakeCase } from "../lib/case.ts";

test("preview mode can never run in production", () => {
  assert.equal(isPreviewEnabled({ ADMIN_PREVIEW_MODE: "true", NODE_ENV: "development" }), true);
  assert.equal(isPreviewEnabled({ ADMIN_PREVIEW_MODE: "true", NODE_ENV: "production" }), false);
  assert.equal(isPreviewEnabled({ ADMIN_PREVIEW_MODE: "false", NODE_ENV: "development" }), false);
});

test("preview lists are empty and keep the requested page window", () => {
  const response = previewResponse("GET", "organizations/abc/members", new URLSearchParams("offset=40&limit=20"));
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { items: [], total: 0, offset: 40, limit: 20 });
  assert.deepEqual(previewResponse("GET", "support/tickets", new URLSearchParams()).body, { items: [], total: 0 });
});

test("preview never invents records and refuses every write", () => {
  assert.equal(previewResponse("GET", "organizations/abc", new URLSearchParams()).status, 404);
  assert.equal(previewResponse("POST", "events", new URLSearchParams()).status, 503);
  assert.equal(previewResponse("DELETE", "events/abc", new URLSearchParams()).status, 503);
  const overview = previewResponse("GET", "overview", new URLSearchParams()).body;
  assert.equal(overview.organizations.total, 0);
  assert.equal(overview.individuals.total, 0);
});

test("request bodies become snake_case and responses become camelCase", () => {
  assert.deepEqual(toSnakeCase({ startDate: "2026-01-02", organizationIds: ["a"], nested: { imageUrl: null } }), {
    start_date: "2026-01-02",
    organization_ids: ["a"],
    nested: { image_url: null },
  });
  assert.deepEqual(toCamelCase({ items: [{ employee_count: 3, created_at: "x" }], total: 1 }), { items: [{ employeeCount: 3, createdAt: "x" }], total: 1 });
});

test("query strings skip empty values and use snake_case keys", () => {
  assert.equal(toQueryString({ q: "", status: undefined, targetType: "user", offset: 0, limit: 20 }), "?target_type=user&offset=0&limit=20");
  assert.equal(toQueryString({}), "");
});
