import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../", import.meta.url));

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : file.endsWith(".tsx") ? [file] : [];
  });
}

function children(element) {
  return element.children.filter((child) => !ts.isJsxText(child) || child.text.trim());
}

function hasIcon(node, source, icons) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const tag = opening.tagName.getText(source);
    if (icons.has(tag) || /^(Icon|Glyph|\w+\.icon)$/.test(tag)) return true;
    // An icon-only wrapper is still an icon, but nested buttons/cards are not.
    return tag === "span" && ts.isJsxElement(node) && children(node).length === 1 && hasIcon(children(node)[0], source, icons);
  }
  return !ts.isJsxText(node) && node.getChildren(source).some((child) => hasIcon(child, source, icons));
}

test("ordinary horizontal icon/text groups use 8px gaps; only fields distribute content", () => {
  const violations = [];
  let checked = 0;
  for (const directory of ["apps/org/app", "apps/org/components", "apps/admin/app", "apps/admin/components", "packages/ui/src"]) {
    for (const file of sourceFiles(path.join(root, directory))) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const icons = new Set();
      const constants = new Map();
      function declarations(node) {
        if (ts.isImportDeclaration(node) && /icons/.test(node.moduleSpecifier.text)) {
          const bindings = node.importClause?.namedBindings;
          if (bindings && ts.isNamedImports(bindings)) bindings.elements.forEach((entry) => icons.add(entry.name.text));
        }
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isStringLiteral(node.initializer)) {
          constants.set(node.name.text, node.initializer.text);
        }
        ts.forEachChild(node, declarations);
      }
      declarations(source);
      function inspect(node) {
        if (ts.isJsxElement(node)) {
          const attributes = node.openingElement.attributes.properties.filter(ts.isJsxAttribute);
          const attr = attributes.find((item) => item.name.getText(source) === "className");
          const value = attr?.initializer;
          const className = value && ts.isJsxExpression(value) && value.expression && ts.isIdentifier(value.expression)
            ? constants.get(value.expression.text) ?? "" : value?.getText(source) ?? "";
          const field = attributes.some((item) => item.name.getText(source) === "data-control" && /["'](?:input|select)["']/.test(item.initializer?.getText(source) ?? ""));
          if (/(?<![\w-])(?:inline-)?flex(?![\w-])/.test(className) && !/flex-col/.test(className) && !field && children(node).length > 1 && children(node).some((child) => hasIcon(child, source, icons))) {
            checked++;
            if (/justify-between|justify-around|justify-evenly/.test(className) || !/(?<![\w-])gap-2(?![\d.])/.test(className) || /(?:\w+:)?gap-(?!2\b)[\d.]+|gap-2\.\d/.test(className)) {
              const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
              violations.push(`${path.relative(root, file)}:${line}: ${className}`);
            }
          }
        }
        ts.forEachChild(node, inspect);
      }
      inspect(source);
    }
  }
  assert.ok(checked > 100, "audit must cover icon/text groups across both dashboards and shared UI");
  assert.deepEqual(violations, []);
});

test("landing-page icon controls use fixed spacing instead of automatic distribution", () => {
  const css = postcss.parse(fs.readFileSync(path.join(root, "apps/landing/src/control-layout.css"), "utf8"));
  const rule = css.nodes.find((node) => node.type === "rule" && node.selector === ":is(a, button):has(> .icon)");
  assert.ok(rule);
  assert.equal(rule.nodes.find((node) => node.prop === "gap").value, "8px");
  assert.equal(rule.nodes.find((node) => node.prop === "justify-content").value, "center");
});
