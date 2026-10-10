import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PUBLIC_ROUTES,
  isSameOriginMutation,
  isValidPath,
  needsAdminKey,
  readIssuedTokens,
  stripTokens,
  upstreamUrl,
} from "../lib/bff.ts";

test("every request is forced into the backend's app-admin namespace", () => {
  assert.equal(upstreamUrl("https://api.example.com/", ["organizations", "abc"], "?limit=5"), "https://api.example.com/app-admin/organizations/abc?limit=5");
  assert.equal(upstreamUrl("https://api.example.com", ["auth", "me"], ""), "https://api.example.com/app-admin/auth/me");
});

test("path traversal and unsafe segments are rejected", () => {
  assert.equal(isValidPath(["organizations", "123"]), true);
  assert.equal(isValidPath([]), false);
  assert.equal(isValidPath([".."]), false);
  assert.equal(isValidPath(["organizations", ".."]), false);
  assert.equal(isValidPath(["organizations%2F..%2Fwellbeing"]), false);
  assert.equal(isValidPath(["a b"]), false);
  assert.equal(isValidPath(Array.from({ length: 9 }, () => "x")), false);
});

test("mutations require a same-origin Origin header", () => {
  assert.equal(isSameOriginMutation("GET", null, "https://admin.wellstaq.com"), true);
  assert.equal(isSameOriginMutation("POST", "https://admin.wellstaq.com", "https://admin.wellstaq.com"), true);
  assert.equal(isSameOriginMutation("POST", "https://app.wellstaq.com", "https://admin.wellstaq.com"), false);
  assert.equal(isSameOriginMutation("DELETE", null, "https://admin.wellstaq.com"), false);
});

test("only sign-in and recovery routes skip authentication", () => {
  assert.deepEqual([...PUBLIC_ROUTES].sort(), ["auth/2fa/verify", "auth/login", "auth/password/forgot", "auth/password/reset", "auth/refresh"]);
  assert.equal(PUBLIC_ROUTES.has("auth/me"), false);
});

test("the static admin key is only attached to the support ticket routes", () => {
  assert.equal(needsAdminKey("support/tickets"), true);
  assert.equal(needsAdminKey("support/tickets/abc-123"), true);
  assert.equal(needsAdminKey("organizations"), false);
  assert.equal(needsAdminKey("support/tickets/abc/extra"), false);
});

test("token responses are read from snake_case bodies, with a capped lifetime", () => {
  assert.deepEqual(readIssuedTokens({ access_token: "a", refresh_token: "r", expires_in: 900 }), { accessToken: "a", refreshToken: "r", expiresIn: 900 });
  assert.equal(readIssuedTokens({ data: { access_token: "a", expires_in: 999999 } }).expiresIn, 14400);
  assert.equal(readIssuedTokens({ access_token: "a" }).expiresIn, 900);
  assert.equal(readIssuedTokens({ two_fa_challenge_token: "c" }), null);
  assert.equal(readIssuedTokens(null), null);
});

test("tokens never reach the browser, but the 2FA challenge does", () => {
  assert.deepEqual(stripTokens({ access_token: "a", refresh_token: "r", token_type: "bearer", expires_in: 1 }), { expires_in: 1 });
  assert.deepEqual(stripTokens({ two_fa_required: true, two_fa_challenge_token: "c", two_fa_method: "totp" }), {
    two_fa_required: true,
    two_fa_challenge_token: "c",
    two_fa_method: "totp",
  });
});
