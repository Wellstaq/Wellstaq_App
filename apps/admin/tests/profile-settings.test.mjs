import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function profileFixture(admin) {
  const state = [];
  let cursor = 0;
  const react = {
    useRef: () => ({ current: null }),
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value) => { state[index] = value; }];
    },
  };
  const jsx = (type, props) => ({ type, props });
  const imports = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    sonner: { toast: { success() {}, error() {} } },
    "@wellstaq/ui/icons": { Camera: "camera", LockKeyhole: "lock" },
    "@/components/ui/avatar": { Avatar: "avatar" },
    "@/components/ui/controls": { Input: "input", Button: "button" },
    "@/components/ui/page-header": { PageHeader: "header" },
    "@/components/ui/button-styles": {},
    "@/components/providers/admin-session": { useAdminSession: () => ({ admin, setAdmin() {} }) },
    "@/lib/format": { fullName: (person) => `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() },
    "@/services/admin-api": { adminApi: {} },
    "@/services/http": { ApiError: Error },
  };
  const source = fs.readFileSync(new URL("../app/(console)/settings/page.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require(name) {
    assert.ok(name in imports, name);
    return imports[name];
  } });
  function render() { cursor = 0; return loaded.exports.default(); }
  function find(tree, predicate) {
    if (!tree || typeof tree !== "object") return undefined;
    if (predicate(tree)) return tree;
    for (const child of [tree.props?.children].flat(Infinity)) {
      const match = find(child, predicate);
      if (match) return match;
    }
  }
  return { render, find };
}

for (const missing of [null, undefined]) {
  test(`new admin can edit either name when initial names are ${missing}`, () => {
    for (const field of ["settings-first-name", "settings-last-name"]) {
      const fixture = profileFixture({ firstName: missing, lastName: missing, avatarUrl: null, email: "admin@example.com" });
      const input = fixture.find(fixture.render(), (node) => node.props?.id === field);
      input.props.onChange({ target: { value: "Ada" } });
      assert.doesNotThrow(() => fixture.render());
      assert.equal(fixture.find(fixture.render(), (node) => node.props?.id === (field === "settings-first-name" ? "settings-last-name" : "settings-first-name")).props.value, "");
      const otherField = field === "settings-first-name" ? "settings-last-name" : "settings-first-name";
      fixture.find(fixture.render(), (node) => node.props?.id === otherField).props.onChange({ target: { value: "Lovelace" } });
      const saved = fixture.find(fixture.render(), (node) => node.type === "button" && node.props.children === "Save changes");
      assert.equal(saved.props.disabled, false);
    }
  });
}
