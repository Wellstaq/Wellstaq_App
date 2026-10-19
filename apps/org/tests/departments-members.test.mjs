import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";

function compile(path, imports) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require(name) {
    assert.ok(name in imports, name);
    return imports[name];
  } });
  return loaded.exports;
}

function walk(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => walk(child, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...walk(node.props.children, predicate)];
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  if (React.isValidElement(node)) return text(node.props.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}

async function setup({ unavailable = false, pendingCount = false, partialFailure = false } = {}) {
  const hooks = [];
  const effects = [];
  let cursor = 0;
  let memberCount = 3;
  let memberReads = 0;
  let resolveCount;
  const members = Array.from({ length: 4 }, (_, i) => ({ id: `member-${i + 1}`, firstName: `Member ${i + 1}`, lastName: "Test", email: `member${i}@example.test`, status: "active", avatarUrl: null, branchId: "branch-1" }));
  const branches = [{ id: "branch-1", name: "Headquarters" }];
  const scope = { type: "branch", branchId: "branch-1" };
  const react = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial;
      return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      return hooks[index] ?? (hooks[index] = { current: initial });
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = hooks[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        effects.push(() => { previous?.cleanup?.(); hooks[index].cleanup = effect(); });
        hooks[index] = { dependencies };
      }
    },
  };
  const api = { organization: {
    getDepartments: async () => ({ items: [{ id: "department-1", name: "Operations", branchId: "branch-1", memberCount: 0 }], total: 1 }),
    getDepartmentRanks: async () => ({ items: [] }),
    getBranchStats: async () => ({ totalUsers: 4, totalEvents: 0 }),
    getBranchActiveUserStats: async () => ({ totalUsers: 4 }),
    getBranchActivitySummary: async () => ({ totalCount: 0 }),
    getMembers: async () => ({ items: members, total: 4 }),
    getDepartmentMemberCount: async () => {
      if (unavailable) throw Error("Unavailable");
      if (pendingCount) return new Promise((resolve) => { resolveCount = resolve; });
      return memberCount;
    },
    getDepartmentMembers: async () => {
      memberReads++;
      return { items: members.slice(0, memberCount), total: memberCount };
    },
    assignDepartmentMember: async (_, __, userId) => {
      if (partialFailure && userId === "member-3") throw Error("Member assignment failed");
      await new Promise((resolve) => setImmediate(resolve));
      memberCount = 4;
    },
  } };
  const imports = {
    react,
    "react/jsx-runtime": jsx,
    "motion/react": { AnimatePresence: "AnimatePresence" },
    "@/components/ui/drawer": { DrawerLayer: "DrawerLayer" },
    "@wellstaq/ui/icons": new Proxy({}, { get: (_, name) => `Icon${name}` }),
    "next/image": "Image",
    "@/hooks/use-click-outside": { useClickOutside() {} },
    "@/components/ui/confirm-modal": { ConfirmModal: "ConfirmModal" },
    sonner: { toast: { success() {} } },
    recharts: new Proxy({}, { get: (_, name) => `Chart${name}` }),
    "@/components/providers/dashboard-data-provider": { useDashboardData: () => ({ organizationId: "org-1", branches, currentUser: { permissions: [] } }) },
    "@/services/api": { api },
    "@/lib/scope": { useDashboardScope: () => ({ scope }) },
    "@/components/dashboard/stat-card": { StatCard: "StatCard" },
    "@/lib/permissions": { hasPermission: () => true },
    "@/lib/errors": { getUserErrorMessage: (_, fallback) => fallback },
    "@/lib/department-members": compile("../lib/department-members.ts", {}),
  };
  const page = compile("../app/dashboard/departments/page.tsx", imports);
  let tree;
  function render() {
    cursor = 0;
    tree = page.default();
    effects.splice(0).forEach((effect) => effect());
  }
  async function flush() {
    for (let i = 0; i < 4; i++) { await new Promise((resolve) => setImmediate(resolve)); render(); }
  }
  render();
  await flush();
  return {
    find: (predicate) => walk(tree, predicate),
    card: () => walk(tree, (node) => node.props.role === "button")[0],
    render, flush,
    memberReads: () => memberReads,
    resolveCount: (count) => resolveCount(count),
  };
}

test("department cards use actual membership when the stored counter is zero", async () => {
  const ui = await setup();
  assert.match(text(ui.card()), /3 members/);
  assert.doesNotMatch(text(ui.card()), /0 members/);
  ui.card().props.onClick();
  await ui.flush();
  await ui.flush();
  assert.equal(ui.memberReads(), 1, "updating count metadata must not repeatedly refetch the member list");
});

test("pending and failed membership requests never appear as zero members", async () => {
  const pending = await setup({ pendingCount: true });
  assert.match(text(pending.card()), /Loading members/);
  assert.doesNotMatch(text(pending.card()), /0 members/);
  pending.resolveCount(9);
  await pending.flush();
  assert.match(text(pending.card()), /9 members/);
  const failed = await setup({ unavailable: true });
  assert.match(text(failed.card()), /Members unavailable/);
  assert.doesNotMatch(text(failed.card()), /0 members/);
});

async function selectMembersForAddition(ui, ids) {
  ui.card().props.onClick();
  await ui.flush();
  ui.find((node) => node.type === "button" && walk(node, (child) => child.type === "IconUserPlus").length > 0)[0].props.onClick();
  ui.render();
  let drawer = ui.find((node) => node.type === "DrawerLayer" && node.props.label === "Add a team member")[0];
  walk(drawer, (node) => node.type === "div" && node.props.onClick && text(node).includes("Select team member to add"))[0].props.onClick();
  ui.render();
  drawer = ui.find((node) => node.type === "DrawerLayer" && node.props.label === "Add a team member")[0];
  for (const id of ids) {
    drawer = ui.find((node) => node.type === "DrawerLayer" && node.props.label === "Add a team member")[0];
    walk(drawer, (node) => node.key === id && node.props.onClick)[0].props.onClick();
    ui.render();
  }
}

test("adding a member refreshes the card and the selected department member list", async () => {
  const ui = await setup();
  await selectMembersForAddition(ui, ["member-4"]);
  await ui.find((node) => node.type === "button" && text(node) === "Add Member")[0].props.onClick();
  await ui.flush();
  assert.match(text(ui.card()), /4 members/);
  assert.equal(ui.memberReads(), 2);
  ui.find((node) => node.type === "button" && text(node) === "Members")[0].props.onClick();
  ui.render();
  assert.ok(ui.find((node) => node.key === "member-4").length > 0);
});

test("a partly failed assignment batch still refreshes the completed membership changes", async () => {
  const ui = await setup({ partialFailure: true });
  await selectMembersForAddition(ui, ["member-3", "member-4"]);
  await assert.rejects(ui.find((node) => node.type === "button" && text(node) === "Add Member")[0].props.onClick(), /Member assignment failed/);
  await ui.flush();
  assert.match(text(ui.card()), /4 members/);
  assert.equal(ui.memberReads(), 2);
});
