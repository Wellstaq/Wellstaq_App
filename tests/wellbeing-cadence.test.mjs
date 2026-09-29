import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function compile(path, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    URL,
    URLSearchParams,
    Map,
    Set,
    Date,
    Math,
    JSON,
    console,
    require: (key) => {
      assert.ok(key in imports, key);
      return imports[key];
    },
  });
  return mod.exports;
}

function apiFixture(requestImplementation) {
  const calls = [];
  class ApiError extends Error {
    constructor(status) {
      super("API error");
      this.status = status;
    }
  }
  const api = compile("../services/api.ts", {
    "@/services/http": {
      request: (path, options) => {
        calls.push({ path, options: options ?? {} });
        return requestImplementation
          ? requestImplementation(path, options, ApiError)
          : Promise.resolve({ organizationId: "org-1", cadence: "weekly", isActive: true });
      },
      ApiError,
    },
    "@/services/config": { backendPath: (path) => path },
    "@/services/auth-token": { getAuthTokens: () => null, clearAuthTokens: () => {} },
  });
  return { api: api.api, calls };
}

test("wellbeing pulse cadence uses the organization config endpoints", async () => {
  const { api, calls } = apiFixture();

  await api.organization.getWellbeingSurveyConfig("org-1");
  assert.equal(calls[0].path, "/organizations/org-1/wellbeing-survey/config");
  assert.equal(calls[0].options.method, undefined);
  assert.equal(calls[0].options.suppressErrorNotification, true);

  await api.organization.updateWellbeingSurveyCadence("org-1", "biweekly");
  assert.equal(calls[1].path, "/organizations/org-1/wellbeing-survey/config");
  assert.equal(calls[1].options.method, "PUT");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1].options.body)), { cadence: "biweekly" });
});

test("a missing survey configuration becomes a quiet first-time setup state", async () => {
  const { api, calls } = apiFixture((_path, _options, ApiError) => Promise.reject(new ApiError(404)));

  const config = await api.organization.getWellbeingSurveyConfig("org-1");

  assert.equal(config, null);
  assert.equal(calls[0].options.suppressErrorNotification, true);
});

test("the cadence page and navigation require organization-wide settings permission", () => {
  const page = fs.readFileSync(new URL("../app/dashboard/wellbeing-pulse/page.tsx", import.meta.url), "utf8");
  const sidebar = fs.readFileSync(new URL("../components/dashboard/sidebar.tsx", import.meta.url), "utf8");

  assert.match(page, /hasOrgWidePermission\(currentUser\.permissions, "org\.settings\.update"\)/);
  assert.match(sidebar, /hasOrgWidePermission\(currentUser\.permissions, "org\.settings\.update"\)/);
  assert.match(sidebar, /href="\/dashboard\/wellbeing-pulse"/);
});
