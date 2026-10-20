import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const code = ts.transpileModule(fs.readFileSync(new URL("../lib/errors.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
vm.runInNewContext(code, { module: loaded, exports: loaded.exports,
  require() { return { permissionFromError: () => null, permissionDeniedMessage: () => "Permission denied." }; },
});
const { getApiErrorMessage, getRequestErrorMessage } = loaded.exports;

test("pending payment conflicts explain how to retry", () => {
  const message = getApiErrorMessage(409, undefined,
    "A payment is already in progress for this organization. Complete it or wait for it to expire before retrying.",
    "This payment record already exists.");
  assert.match(message, /payment is already pending/);
  assert.match(message, /cancel the unpaid checkout/);
});

test("business conflicts preserve their actual explanation", () => {
  assert.equal(getApiErrorMessage(409, undefined, "Only suspended users can be reinstated.", "Already exists."),
    "Only suspended users can be reinstated.");
  assert.doesNotMatch(getRequestErrorMessage("/organizations/org/checkout", "POST", 409), /already exists/);
});

test("technical exceptions and server faults stay hidden", () => {
  assert.equal(getApiErrorMessage(409, undefined, "IntegrityError: database constraint", "Please try again."), "Please try again.");
  assert.doesNotMatch(getApiErrorMessage(500, undefined, "Traceback database failed"), /Traceback|database/);
});
