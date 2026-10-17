import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";
const compiled = ts.transpileModule(fs.readFileSync(new URL("../lib/combined-feed.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = { exports: {} };
vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports });
const { createCombinedFeedLoader } = loaded.exports;
const post = (id, day) => ({ id, createdAt: new Date(2026, 0, day).toISOString() });
const source = (items, pageSize = 2) => async (offset) => ({ items: items.slice(offset, offset + pageSize), offset, total: items.length, limit: pageSize });
test("all feeds merge newest first, deduplicate General posts and page to exhaustion", async () => {
 const general = post("general", 4);
 const load = createCombinedFeedLoader([source([general, post("old", 1)]), source([post("branch-a", 5), general, post("branch-b", 3)]), source([general, post("branch-c", 2)])], 2);
 const all = [];
 for (let offset = 0; ; offset += 2) {
  const page = await load(offset); all.push(...page.items.map(p => p.id));
  if (offset + page.items.length >= page.total) break;
 }
 assert.deepEqual(all, ["branch-a", "general", "branch-b", "branch-c", "old"]);
});
test("empty and overlapping sources terminate without duplicates", async () => {
 const load = createCombinedFeedLoader([source([]), source([post("a", 1)]), source([post("a", 1)])]);
 const page = await load(0);
 assert.deepEqual(Array.from(page.items, p => p.id), ["a"]);
 assert.equal(page.total, 1);
});
test("failed source requests can retry without losing already loaded sources", async () => {
 let fail = true;
 const load = createCombinedFeedLoader([source([post("a", 2)]), async offset => { if(fail) { fail = false; throw Error("offline"); } return source([post("b", 1)])(offset); }]);
 await assert.rejects(load(0), /offline/);
 const page = await load(0);
 assert.deepEqual(Array.from(page.items, p => p.id), ["a", "b"]);
});
