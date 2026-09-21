import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

/** Loads services/http.ts with a scripted fetch, so the response shapes the API
 *  really sends can be checked without touching live data. */
function loadHttp(responder) {
  const code = ts.transpileModule(fs.readFileSync(new URL("../services/http.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const calls = [];
  const imports = {
    "@/services/auth-token": { getAuthTokens: () => null, updateAccessToken: () => {}, clearAuthTokens: () => {} },
    "@/services/config": { backendPath: (path) => path },
    "@/lib/errors": {
      getApiErrorMessage: (status, code, raw, fallback) => raw || fallback || `status ${status}`,
      getFieldErrorMessage: (msg) => msg,
      getFriendlyFieldErrors: () => undefined,
      getRequestErrorMessage: (path, method, status) => `${method} ${path} failed with ${status}`,
    },
  };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports,
    Headers, AbortController, DOMException, FormData, File, setTimeout, clearTimeout, globalThis,
    fetch: async (url, init) => { calls.push({ url, init }); return responder(url, init); },
    require: (key) => { assert.ok(key in imports, key); return imports[key]; },
  });
  return { request: mod.exports.request, ApiError: mod.exports.ApiError, calls };
}

/** A minimal Response: only what request() actually reads. */
const reply = ({ status = 200, body = "", contentType = null }) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: new Headers(contentType ? { "content-type": contentType } : {}),
  text: async () => body,
  json: async () => JSON.parse(body),
});

test("a 204 with a JSON content-type resolves instead of reporting a failed delete", async () => {
  // Every DELETE in this API answers 204. When that 204 carries a JSON
  // content-type and an empty body, parsing it used to throw — reporting a
  // delete that had already succeeded on the server as an error to the user.
  const { request } = loadHttp(() => reply({ status: 204, contentType: "application/json" }));
  await assert.doesNotReject(request("/organizations/o/posts/p/comments/c", { method: "DELETE" }));
});

test("a 204 with no content-type at all also resolves", async () => {
  const { request } = loadHttp(() => reply({ status: 204 }));
  await assert.doesNotReject(request("/organizations/o/stories/s", { method: "DELETE" }));
});

test("a real JSON body is still parsed and camelCased", async () => {
  const { request } = loadHttp(() => reply({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ like_count: 3, liked: true, nested: { media_url: "u" } }),
  }));
  const result = await request("/organizations/o/posts/p/like", { method: "POST" });
  assert.equal(result.likeCount, 3);
  assert.equal(result.liked, true);
  assert.equal(result.nested.mediaUrl, "u");
});

test("a response wrapped in { data } is still unwrapped", async () => {
  const { request } = loadHttp(() => reply({
    status: 200, contentType: "application/json", body: JSON.stringify({ data: { first_name: "Yemi" } }),
  }));
  assert.equal((await request("/auth/me")).firstName, "Yemi");
});

test("malformed JSON is still an error, not a silent empty result", async () => {
  const { request, ApiError } = loadHttp(() => reply({ status: 200, contentType: "application/json", body: "{not json" }));
  await assert.rejects(request("/anything"), (error) => error instanceof ApiError && error.code === "INVALID_RESPONSE");
});

test("an error status with an empty body still rejects", async () => {
  const { request, ApiError } = loadHttp(() => reply({ status: 500, contentType: "application/json" }));
  await assert.rejects(request("/anything", { method: "DELETE", suppressErrorNotification: true }), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 500);
    return true;
  });
});

test("an error status with a JSON detail keeps that message", async () => {
  const { request, ApiError } = loadHttp(() => reply({
    status: 403, contentType: "application/json", body: JSON.stringify({ detail: "You can only delete your own comment" }),
  }));
  await assert.rejects(request("/anything", { method: "DELETE", suppressErrorNotification: true }), (error) => {
    assert.ok(error instanceof ApiError);
    assert.match(error.message, /only delete your own comment/);
    return true;
  });
});
