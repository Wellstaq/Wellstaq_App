import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import ts from "typescript";

function load(file, imports) {
  const compiled = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, require(name) {
    assert.ok(name in imports, `Unexpected import: ${name}`);
    return imports[name];
  } });
  return loaded.exports;
}

const { cn } = load("../../../packages/ui/src/utils.ts", { clsx: { clsx }, "tailwind-merge": { twMerge } });
const permissions = load("../lib/permissions.ts", {});

function walk(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => walk(child, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...walk(node.props.children, predicate)];
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  if (React.isValidElement(node)) return text(node.props.children);
  return typeof node === "string" ? node : "";
}

function setup(scope = { type: "overview" }) {
  const hooks = [];
  let cursor = 0;
  const imports = {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in hooks)) hooks[index] = initial;
        return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }];
      },
      useRef(initial) {
        const index = cursor++;
        return hooks[index] ?? (hooks[index] = { current: initial });
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/link": "Link",
    "next/image": "Image",
    "next/navigation": { usePathname: () => "/dashboard", useRouter: () => ({ push() {} }) },
    "@wellstaq/ui/icons": new Proxy({}, { get: (_, name) => `Icon${name}` }),
    "@/lib/constants": { ASSETS: { LOGO: "/logo.png" } },
    "@/lib/utils": { cn },
    "@/lib/permissions": permissions,
    "@/hooks/use-click-outside": { useClickOutside() {} },
    "@/lib/scope": { useDashboardScope: () => ({ scope, setScope() {}, isScopeChanging: false }) },
    "@/components/providers/dashboard-data-provider": {
      useDashboardData: () => ({
        challenges: [{ id: "challenge-1", title: "Step challenge", branchId: "branch-1" }],
        branches: [{ id: "branch-1", name: "Lagos" }],
        currentUser: { permissions: ["overview", "branch.create", "challenge.create", "member.invite"].map((name) => ({ name, branchId: null })) },
      }),
    },
  };
  const { Sidebar } = load("../components/dashboard/sidebar.tsx", imports);
  let tree;
  const render = () => { cursor = 0; tree = Sidebar({}); };
  render();
  return {
    find: (predicate) => walk(tree, predicate),
    link(label) {
      const link = this.find((node) => node.type === "Link" && text(node.props.children) === label)[0];
      assert.ok(link, `Missing link: ${label}`);
      return link;
    },
    click(label) {
      const button = this.find((node) => node.type === "button" && node.props["aria-label"] === label)[0];
      assert.ok(button, `Missing button: ${label}`);
      button.props.onClick();
      render();
    },
  };
}

test("expanded sidebar navigation keeps every icon and label 8px apart", () => {
  const ui = setup();
  for (const label of ["Dashboard", "Insights", "Department", "Space", "Events", "Team", "Pending Invites", "Settings", "Contact Support", "Add Integration"]) {
    const { className } = ui.link(label).props;
    assert.match(className, /\bgap-2\b/, label);
    assert.match(className, /\bjustify-start\b/, label);
    assert.doesNotMatch(className, /justify-between|gap-3/, label);
  }
  assert.equal(ui.link("Dashboard").props["aria-current"], "page");
});

test("challenge shortcuts and their trailing chevrons keep compact 8px gaps", () => {
  const ui = setup();
  assert.match(ui.link("Step challenge").props.className, /\bgap-2\b/);
  const more = ui.link("More Challenges");
  assert.match(more.props.className, /\bjustify-start\b/);
  assert.match(more.props.className, /\bgap-2\b/);
  assert.doesNotMatch(more.props.className, /justify-between/);
  const group = walk(more.props.children, (node) => node.type === "div" && text(node.props.children) === "More Challenges")[0];
  assert.match(group.props.className, /\bgap-2\b/);
  assert.doesNotMatch(group.props.className, /justify-between|gap-3/);
});

test("collapsing centers the remaining icons, and expanding restores 8px label spacing", () => {
  const ui = setup();
  ui.click("Collapse sidebar");
  for (const href of ["/dashboard", "/dashboard/insights", "/dashboard/departments", "/dashboard/space", "/dashboard/events", "/dashboard/teams", "/dashboard/invites", "/dashboard/settings", "/dashboard/contact"]) {
    const link = ui.find((node) => node.type === "Link" && node.props.href === href)[0];
    assert.ok(link, href);
    assert.match(link.props.className, /\bjustify-center\b/, href);
    assert.doesNotMatch(link.props.className, /justify-between|justify-start/, href);
    assert.equal(text(link.props.children), "", href);
  }
  ui.click("Expand sidebar");
  assert.match(ui.link("Team").props.className, /\bgap-2\b/);
  assert.match(ui.link("Team").props.className, /\bjustify-start\b/);
});

test("branch-menu choices keep their icons next to labels without spreading them apart", () => {
  const ui = setup();
  ui.click("Switch organization scope");
  const trigger = ui.find((node) => node.type === "button" && node.props["aria-label"] === "Switch organization scope")[0];
  assert.match(trigger.props.className, /\bjustify-between\b/);
  assert.match(trigger.props.children[0].props.className, /\bgap-2\b/);
  assert.match(trigger.props.children[0].props.className, /\bjustify-start\b/);
  for (const label of ["Overview", "Lagos", "Add branch"]) {
    const button = ui.find((node) => node.type === "button" && !node.props["aria-label"] && text(node.props.children).trim() === label)[0];
    assert.ok(button, label);
    assert.match(button.props.className, /\bgap-2\b/);
    assert.match(button.props.className, /\bjustify-start\b/);
    assert.doesNotMatch(button.props.className, /justify-between|gap-3/);
  }
});

test("branch-scoped links preserve their context with the same compact spacing", () => {
  const ui = setup({ type: "branch", branchId: "branch-1" });
  assert.equal(ui.link("Team").props.href, "/dashboard/teams?branchId=branch-1");
  assert.match(ui.link("Team").props.className, /\bgap-2\b/);
  assert.match(ui.link("Team").props.className, /\bjustify-start\b/);
});
