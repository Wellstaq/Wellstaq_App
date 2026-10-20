import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const code = ts.transpileModule(fs.readFileSync(new URL("../lib/activity-schedule.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
vm.runInNewContext(code, { module: loaded, exports: loaded.exports, Date });
const { activitySchedule } = loaded.exports;
const challenge = { startDate: "2026-10-22", endDate: "2026-10-28", status: "upcoming" };

test("upcoming counts to start, active counts to finish even with a stale stored status", () => {
  const upcoming = activitySchedule(challenge, new Date(2026, 9, 20, 23, 59));
  assert.equal(upcoming.status, "upcoming");
  assert.equal(upcoming.countdown, "2 days until start");
  const active = activitySchedule(challenge, new Date(2026, 9, 22));
  assert.equal(active.status, "active");
  assert.equal(active.countdown, "6 days until finish");
});

test("the final date stays active through the entire day", () => {
  assert.equal(activitySchedule(challenge, new Date(2026, 9, 28, 23, 59)).countdown, "Ends today");
  assert.equal(activitySchedule(challenge, new Date(2026, 9, 29)).status, "completed");
  assert.equal(activitySchedule(challenge, new Date(2026, 9, 29)).countdown, "Finished");
});

test("events stay upcoming until their start time", () => {
  const event = { ...challenge, status: "scheduled", time: "14:00:00" };
  assert.equal(activitySchedule(event, new Date(2026, 9, 22, 13, 59)).countdown, "Starts today");
  assert.equal(activitySchedule(event, new Date(2026, 9, 22, 14)).status, "active");
});

test("events without end dates do not get a fabricated completion date", () => {
  const event = { ...challenge, status: "ongoing", endDate: null };
  assert.equal(activitySchedule(event, new Date(2026, 9, 30)).status, "active");
  assert.equal(activitySchedule(event, new Date(2026, 9, 30)).countdown, "End date not set");
});

test("cancelled, archived and explicitly completed activities stay terminal", () => {
  for (const status of ["cancelled", "archived", "completed"]) {
    assert.equal(activitySchedule({ ...challenge, status }, new Date(2026, 9, 20)).status, status);
  }
});
