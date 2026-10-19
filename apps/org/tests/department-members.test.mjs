import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function load(path, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require(name) {
    assert.ok(name in imports, name);
    return imports[name];
  } });
  return loaded.exports;
}

const { loadDepartmentMemberCounts } = load("../lib/department-members.ts");

test("member counts use the full membership total, not the one-row page length", async () => {
  const calls = [];
  const { api } = load("../services/api.ts", {
    "@/services/config": { backendPath: (path) => `/api/backend${path}` },
    "@/services/auth-token": { clearCachedCurrentUser() {} },
    "@/services/http": { request: async (path, options) => {
      calls.push({ path, options });
      return { total: 257, items: [{ id: "member-1" }] };
    } },
  });
  assert.equal(await api.organization.getDepartmentMemberCount("org-1", "department-1"), 257);
  assert.equal(calls[0].path, "/api/backend/organizations/org-1/departments/department-1/members?limit=1");
  assert.equal(calls[0].options.suppressErrorNotification, true);
});

test("department counts load independently with at most four requests in flight", async () => {
  let active = 0;
  let peak = 0;
  const counts = new Map();
  await loadDepartmentMemberCounts(Array.from({ length: 12 }, (_, i) => String(i)), async (id) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setImmediate(resolve));
    active--;
    if (id === "2") throw Error("Unavailable");
    return Number(id);
  }, (id, count) => counts.set(id, count));
  assert.equal(peak, 4);
  assert.equal(counts.get("0"), 0);
  assert.equal(counts.get("2"), null);
  assert.equal(counts.get("11"), 11);
  assert.equal(counts.size, 12);
});

test("leaving a scope discards late totals and stops queued count requests", async () => {
  let cancelled = false;
  const pending = [];
  const updates = [];
  const loading = loadDepartmentMemberCounts(Array.from({ length: 10 }, (_, i) => String(i)),
    () => new Promise((resolve) => pending.push(resolve)),
    (...update) => updates.push(update), () => cancelled);
  assert.equal(pending.length, 4);
  cancelled = true;
  pending.forEach((resolve) => resolve(8));
  await loading;
  assert.equal(pending.length, 4);
  assert.equal(updates.length, 0);
});
