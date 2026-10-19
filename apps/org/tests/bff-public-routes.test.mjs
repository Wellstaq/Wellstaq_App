import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function compile(path, imports = {}, globals = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, {
    module: loaded, exports: loaded.exports,
    Headers, AbortController, DOMException, TextEncoder, setTimeout, clearTimeout,
    process: { env: { BACKEND_API_URL: "https://backend.example.test" } },
    require(name) { assert.ok(name in imports, name); return imports[name]; },
    ...globals,
  });
  return loaded.exports;
}

const rules = compile("../lib/bff.ts");

function proxyFixture() {
  const calls = [];
  const proxy = compile("../app/api/backend/[...path]/route.ts", {
    "@/lib/bff": rules,
    "next/server": {
      NextResponse: {
        json: (body, { status }) => ({ body, status, cookies: { set() {} } }),
      },
    },
  }, {
    fetch: async (url) => {
      calls.push(url);
      return new Response(JSON.stringify({ available: true }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    },
  });
  return {
    calls,
    get(path, search = "") {
      return proxy.GET({
        method: "GET", headers: new Headers(), cookies: { get() {} },
        nextUrl: new URL(`https://frontend.example.test/api/backend/${path}${search}`),
      }, { params: Promise.resolve({ path: path.split("/") }) });
    },
  };
}

test("a new signup can check phone availability without a session", async () => {
  const fixture = proxyFixture();
  const response = await fixture.get("auth/signup/check/phone", "?number=%2B12025550123");
  assert.equal(response.status, 200);
  assert.equal(response.body.available, true);
  assert.deepEqual(fixture.calls, ["https://backend.example.test/auth/signup/check/phone?number=%2B12025550123"]);
});

test("the public phone route matches the signup client, not the nonexistent alias", () => {
  const apiSource = fs.readFileSync(new URL("../services/api.ts", import.meta.url), "utf8");
  assert.match(apiSource, /\/auth\/signup\/check\/phone\?number=/);
  assert.equal(rules.PUBLIC_ROUTES.has("auth/signup/check/phone"), true);
  assert.equal(rules.PUBLIC_ROUTES.has("auth/signup/check/phone-number"), false);
});

test("account and organization routes still require an authenticated session", async () => {
  for (const path of ["auth/me", "organizations/org-1/departments"]) {
    const fixture = proxyFixture();
    const response = await fixture.get(path);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHENTICATED");
    assert.equal(fixture.calls.length, 0);
  }
});
