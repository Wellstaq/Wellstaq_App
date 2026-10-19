import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as iconsax from "iconsax-react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import postcss from "postcss";

function load(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, ...globals, require(name) { assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name]; } });
  return loaded.exports;
}

const model = load("../lib/product-tour.ts");
const icons = load("../../../packages/ui/src/icons.tsx", { react: React, "react/jsx-runtime": jsx, "iconsax-react": iconsax });
const css = new Proxy({}, { get: (_, key) => key });
const { TourCard, findTourTarget, openProductTour } = load("../components/dashboard/product-tour.tsx", {
  react: React, "react/jsx-runtime": jsx, "react-dom": {}, "next/navigation": {},
  "@wellstaq/ui/icons": icons, "@/components/providers/dashboard-data-provider": {},
  "@/lib/product-tour": model, "./product-tour.module.css": { __esModule: true, default: css },
}, {
  document: { querySelectorAll: () => targetFixtures },
  window: { getComputedStyle: (element) => element.style, dispatchEvent(event) { dispatched = event; } },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
});

let targetFixtures = [];
let dispatched;

function element({ disabled = false, hidden = false, rendered = true, visibility = "visible" } = {}) {
  return { style: { display: "block", visibility }, getClientRects: () => rendered ? [{}] : [], matches: () => disabled, closest: () => hidden ? {} : null };
}

test("tour completion preferences are versioned and isolated by account and organization", () => {
  assert.match(model.tourStorageKey("user-a", "org-a"), /:v1:/);
  assert.notEqual(model.tourStorageKey("user-a", "org-a"), model.tourStorageKey("user-b", "org-a"));
  assert.notEqual(model.tourStorageKey("user-a", "org-a"), model.tourStorageKey("user-a", "org-b"));
  assert.notEqual(model.tourStorageKey("a:b", "c"), model.tourStorageKey("b", "c:a"));
});

test("overview and page guides have distinct IDs and actionable, nonempty copy", () => {
  const routes = ["/dashboard", ...["teams", "insights", "departments", "space", "events", "challenges", "settings", "invites", "clubs", "contact", "integrations", "notifications", "messages", "wellbeing-pulse", "profile/123", "events/123", "challenges/123", "unknown"].map((route) => `/dashboard/${route}`)];
  for (const steps of [model.DASHBOARD_TOUR, ...routes.map(model.getPageTour)]) {
    assert.ok(steps.length);
    assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);
    for (const step of steps) {
      assert.ok(step.title.length > 8);
      assert.ok(step.description.length > 30);
      assert.ok(["workspace", "people", "insights", "space", "events", "settings"].includes(step.preview));
    }
  }
  assert.ok(model.getPageTour("/dashboard/teams").some((step) => step.target?.includes("invite-member")));
  assert.ok(!model.getPageTour("/dashboard/events/123").some((step) => step.id === "create-event"));
});

test("target discovery skips hidden, unavailable, and disabled controls", () => {
  const visible = element();
  targetFixtures = [element({ rendered: false }), element({ hidden: true }), element({ visibility: "hidden" }), element({ disabled: true }), visible];
  assert.equal(findTourTarget("selector"), visible);
  targetFixtures = [element({ disabled: true })];
  assert.equal(findTourTarget("selector"), null);
});

test("launchers request a guide without navigating or executing the highlighted action", () => {
  openProductTour();
  assert.equal(dispatched.type, model.OPEN_TOUR_EVENT);
  assert.equal(dispatched.detail, "page");
  openProductTour("dashboard");
  assert.equal(dispatched.detail, "dashboard");
});

test("spotlight cards render progress and named actions without a sample dashboard", () => {
  for (const [index, label] of [[0, "Show me around"], [1, "Next"], [model.DASHBOARD_TOUR.length - 1, "Got it"]]) {
    const html = renderToStaticMarkup(React.createElement(TourCard, {
      steps: model.DASHBOARD_TOUR, index, kind: "dashboard", titleId: "tour-title", descriptionId: "tour-description", onBack() {}, onNext() {}, onClose() {},
    }));
    assert.match(html, /aria-hidden="true"/);
    assert.doesNotMatch(html, /miniWindow|miniChart|miniRail/);
    assert.doesNotMatch(html, /stepIcon|eyebrow|WELCOME TO WELLSTAQ|A CLOSER LOOK/);
    assert.match(html, /role="progressbar"/);
    assert.match(html, new RegExp(`aria-valuenow="${index + 1}"`));
    assert.match(html, /id="tour-title" tabindex="-1"/);
    assert.match(html, /id="tour-description"/);
    assert.ok(html.includes(label));
    assert.match(html, />Back<\/button>/);
    assert.equal(/<button[^>]*disabled=""[^>]*>Back<\/button>/.test(html), index === 0);
    assert.equal(html.includes(">Skip<"), index < model.DASHBOARD_TOUR.length - 1);
    if (index < model.DASHBOARD_TOUR.length - 1) assert.ok(html.indexOf(">Skip<") < html.indexOf(">Back<"));
  }
});

test("guide cards have no decorative topic icons, sample data, or remote assets", () => {
  for (const preview of ["workspace", "insights", "people", "space", "events", "settings"]) {
    const html = renderToStaticMarkup(React.createElement(TourCard, { steps: [{ ...model.DASHBOARD_TOUR[0], preview }], index: 0, kind: "page", titleId: "t", descriptionId: "d", onBack() {}, onNext() {}, onClose() {} }));
    assert.match(html, /<svg/);
    assert.doesNotMatch(html, /stepIcon|miniWindow/);
    assert.doesNotMatch(html, /<img|(?:src|href)="https?:/);
  }
});

test("card positioning stays within mobile, desktop, short, and zoomed viewport bounds", () => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 640, height: 360 }, { width: 1440, height: 900 }]) {
    for (const target of [null, { left: 12, top: 110, width: 210, height: 40 }, { left: viewport.width - 60, top: viewport.height - 60, width: 40, height: 40 }]) {
      const position = model.placeTourCard(target, viewport, { width: 408, height: 480 });
      assert.ok(position.left >= 16);
      assert.ok(position.top >= 16);
      assert.ok(position.left + position.width <= viewport.width - 16);
      assert.ok(position.top + Math.min(480, viewport.height - 32) <= viewport.height - 16);
    }
  }
  const beside = model.placeTourCard({ left: 12, top: 160, width: 210, height: 40 }, { width: 1440, height: 900 }, { width: 408, height: 480 });
  assert.ok(beside.left > 222);
});

test("tour styling keeps 8px action gaps, a bounded scrollable card, and a short-screen layout", () => {
  const css = postcss.parse(fs.readFileSync(new URL("../components/dashboard/product-tour.module.css", import.meta.url), "utf8"));
  const actions = css.nodes.find((node) => node.type === "rule" && node.selector === ".actions");
  assert.equal(actions.nodes.find((node) => node.prop === "gap").value, "8px");
  const card = css.nodes.find((node) => node.type === "rule" && node.selector === ".card");
  assert.equal(card.nodes.find((node) => node.prop === "max-height").value, "calc(100dvh - 32px)");
  assert.ok(css.nodes.some((node) => node.type === "atrule" && node.params === "(max-height: 640px)"));
});
