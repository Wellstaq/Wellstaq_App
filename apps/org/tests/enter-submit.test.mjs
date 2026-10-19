import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import React from "react";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";

function load(file, imports) {
  const compiled = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, require(name) { assert.ok(name in imports, name); return imports[name]; } });
  return loaded.exports;
}

const react = { ...React, useRef: (value) => ({ current: value }) };
const { ActionForm } = load("../components/ui/action-form.tsx", { react, "react/jsx-runtime": jsx });
const submitEvent = () => ({ prevented: false, preventDefault() { this.prevented = true; } });

test("Enter and a submit button use one guarded native form action without reloading", async () => {
  let calls = 0;
  const form = ActionForm({ canSubmit: true, onAction() { calls++; }, children: "Fields" });
  assert.equal(form.type, "form");
  assert.equal(form.props.noValidate, true);
  const event = submitEvent();
  await form.props.onSubmit(event);
  assert.equal(calls, 1);
  assert.equal(event.prevented, true);
  for (const props of [{ canSubmit: false }, { canSubmit: true, pending: true }]) {
    await ActionForm({ ...props, onAction() { calls++; } }).props.onSubmit(submitEvent());
  }
  assert.equal(calls, 1);
});

test("rapid submits are single-flight and another attempt works after completion", async () => {
  let resolve;
  let calls = 0;
  const form = ActionForm({ canSubmit: true, onAction() { calls++; return new Promise((done) => { resolve = done; }); } });
  const first = form.props.onSubmit(submitEvent());
  await form.props.onSubmit(submitEvent());
  assert.equal(calls, 1);
  resolve();
  await first;
  const next = form.props.onSubmit(submitEvent());
  assert.equal(calls, 2);
  resolve();
  await next;
});

test("a failed primary action releases the submit guard for a retry", async () => {
  let calls = 0;
  const form = ActionForm({ canSubmit: true, onAction() { calls++; throw Error("Try again"); } });
  await assert.rejects(form.props.onSubmit(submitEvent()), /Try again/);
  await assert.rejects(form.props.onSubmit(submitEvent()), /Try again/);
  assert.equal(calls, 2);
});

test("IME and held Enter do not repeat single-line actions; multiline and dropdown keys stay intact", () => {
  const form = ActionForm({ canSubmit: true, onAction() {} });
  function keyEvent({ multiline = false, composing = false, repeat = false, key = "Enter" } = {}) {
    return { key, repeat, nativeEvent: { isComposing: composing }, defaultPrevented: false, target: { closest: () => multiline ? {} : null }, preventDefault() { this.defaultPrevented = true; } };
  }
  for (const options of [{ composing: true }, { repeat: true }]) {
    const event = keyEvent(options);
    form.props.onKeyDown(event);
    assert.equal(event.defaultPrevented, true);
  }
  for (const options of [{}, { multiline: true }, { multiline: true, repeat: true }, { key: "ArrowDown", repeat: true }]) {
    const event = keyEvent(options);
    form.props.onKeyDown(event);
    assert.equal(event.defaultPrevented, false);
  }
  let delegated = false;
  const custom = ActionForm({ canSubmit: true, onAction() {}, onKeyDown(event) { delegated = true; event.preventDefault(); } });
  custom.props.onKeyDown(keyEvent());
  assert.equal(delegated, true);
});

function walk(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => walk(child, predicate));
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...walk(node.props.children, predicate)];
}

test("every signup step submits Continue, not Resend, a visibility toggle, or a selection pill", async () => {
  const valid = { email: "test@example.test", password: "Password1!", firstName: "Test", lastName: "Person", phoneNumber: "08012345678", businessName: "Test company", employeeCount: "6 - 10", organizationType: "Technology / SaaS", workModel: "Hybrid" };
  const names = ["Step1Email", "Step2OTP", "Step3Password", "Step4Personal", "Step5Business", "Step6Organization", "Step7WorkModel"];
  const files = ["step-1-email", "step-2-otp", "step-3-password", "step-4-personal", "step-5-business", "step-6-organization", "step-7-work-model"];
  const { PASSWORD_RULES, isPasswordValid } = load("../lib/password-validation.ts", {});
  for (const [index, file] of files.entries()) {
    const imports = {
      react: { ...react, useState: (initial) => [Array.isArray(initial) ? ["1", "2", "3", "4", "5", "6"] : typeof initial === "number" ? 0 : initial, () => {}], useEffect() {} },
      "react/jsx-runtime": jsx,
      "@/components/ui/action-form": { ActionForm },
      "@/components/ui/button": { Button: "Button" },
      "@/components/ui/input": { Input: "Input" },
      "@/components/ui/label": { Label: "Label" },
      "@/components/ui/selectable-pill": { SelectablePill: "SelectablePill" },
      "@wellstaq/ui/icons": new Proxy({}, { get: (_, name) => `Icon${name}` }),
      "next/link": "Link",
      "@/services/api": { api: { auth: {}, onboarding: {} } },
      "@/hooks/use-field-availability": { useFieldAvailability: () => "available" },
      "@/components/onboarding/field-error": { FieldError: "FieldError" },
      "@/lib/password-validation": { PASSWORD_RULES, isPasswordValid },
    };
    const Step = load(`../components/onboarding/${file}.tsx`, imports)[names[index]];
    let calls = 0;
    let code;
    const tree = Step({ data: valid, updateData() {}, onNext(value) { calls++; code = value; }, isLoading: false });
    assert.equal(tree.type, ActionForm, file);
    assert.equal(tree.props.canSubmit, true, file);
    const buttons = walk(tree, (node) => node.type === "Button");
    assert.equal(buttons.length, 1, file);
    assert.equal(buttons[0].props.type, "submit", file);
    assert.equal(buttons[0].props.onClick, undefined, file);
    await ActionForm(tree.props).props.onSubmit(submitEvent());
    assert.equal(calls, 1, file);
    if (index === 1) {
      assert.equal(code, "123456");
      const resend = walk(tree, (node) => node.type === "button" && node.props.children === "Resend")[0];
      assert.equal(resend.props.type, "button");
    }
    const busy = Step({ data: valid, updateData() {}, onNext() { calls++; }, isLoading: true });
    await ActionForm(busy.props).props.onSubmit(submitEvent());
    assert.equal(calls, 1, file);
  }
});
