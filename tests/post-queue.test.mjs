import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

/** Loads lib/post-queue.ts with a scripted API and toast, so publishing can be
 *  driven without posting anything to a real feed. */
function loadQueue(createPost) {
  const code = ts.transpileModule(fs.readFileSync(new URL("../lib/post-queue.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const toasts = [];
  const events = [];
  const imports = {
    sonner: {
      toast: {
        loading: (message) => { toasts.push({ kind: "loading", message, id: "t1" }); return "t1"; },
        success: (message, options) => toasts.push({ kind: "success", message, id: options?.id }),
        error: (message, options) => toasts.push({ kind: "error", message, id: options?.id }),
      },
    },
    "@/services/api": { api: { post: { createPost } } },
  };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports,
    // Error is shared with this realm so `instanceof Error` still holds for
    // rejections created out here.
    Promise, JSON, Error, console,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    window: { dispatchEvent: (event) => events.push(event) },
    require: (key) => { assert.ok(key in imports, key); return imports[key]; },
  });
  return { ...mod.exports, toasts, events, last: () => toasts[toasts.length - 1] };
}

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const draft = (over = {}) => ({
  organizationId: "org-1", branchId: null, audienceName: "Everyone",
  content: "Morning walk done", location: null, uploads: [], mediaType: undefined,
  ...over,
});

test("Post can be pressed while an upload is still running — the post goes out when it lands", async () => {
  const calls = [];
  const queue = loadQueue(async (orgId, payload) => { calls.push([orgId, payload]); return { id: "post-9", branchId: null }; });
  const upload = deferred();

  const publishing = queue.publishPostInBackground(draft({ uploads: [upload.promise], mediaType: "image" }));

  // Nothing is posted yet, but the person already has feedback and their
  // composer back.
  assert.equal(calls.length, 0, "the post must wait for its attachment");
  assert.deepEqual(queue.toasts.map(t => t.kind), ["loading"]);
  assert.match(queue.toasts[0].message, /Uploading/);

  upload.resolve("https://cdn.example/walk.jpg");
  await publishing;

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][1].mediaUrls, ["https://cdn.example/walk.jpg"]);
  assert.equal(calls[0][1].mediaUrl, "https://cdn.example/walk.jpg", "the legacy single field still carries the first");
  assert.equal(calls[0][1].content, "Morning walk done");
  assert.equal(calls[0][1].branchId, null);
});

test("finishing in the background replaces the pending toast rather than stacking a new one", async () => {
  const queue = loadQueue(async () => ({ id: "post-9", branchId: null }));
  await queue.publishPostInBackground(draft({ audienceName: "Lagos Branch" }));

  assert.deepEqual(queue.toasts.map(t => t.kind), ["loading", "success"]);
  assert.equal(queue.last().id, "t1", "the success must update the pending toast, not add a second");
  assert.match(queue.last().message, /Lagos Branch/);
});

test("a published post is announced so an open feed can show it without refetching", async () => {
  const created = { id: "post-9", branchId: "branch-1" };
  const queue = loadQueue(async () => created);
  await queue.publishPostInBackground(draft({ branchId: "branch-1" }));

  const published = queue.events.filter(e => e.type === queue.POST_PUBLISHED_EVENT);
  assert.equal(published.length, 1);
  assert.equal(published[0].detail, created);
});

test("a failed upload names the file and hands the wording back instead of losing it", async () => {
  const queue = loadQueue(async () => assert.fail("no post may be created when an attachment failed"));
  const upload = Promise.reject(new Error("“holiday.mp4” didn't upload. Check your connection and add it again."));
  upload.catch(() => {});

  await queue.publishPostInBackground(draft({ content: "A long post I do not want to retype", uploads: [upload] }));

  assert.equal(queue.last().kind, "error");
  assert.match(queue.last().message, /holiday\.mp4/, "the toast must name the file that failed");
  assert.equal(queue.last().id, "t1");

  const failed = queue.events.filter(e => e.type === queue.POST_FAILED_EVENT);
  assert.equal(failed.length, 1);
  assert.equal(failed[0].detail.content, "A long post I do not want to retype");
});

test("a rejected createPost also hands the draft back, and announces no post", async () => {
  const queue = loadQueue(async () => { throw new Error("We couldn't publish the post. Try again."); });
  await queue.publishPostInBackground(draft({ content: "Keep me" }));

  assert.equal(queue.last().kind, "error");
  assert.equal(queue.events.filter(e => e.type === queue.POST_PUBLISHED_EVENT).length, 0);
  assert.equal(queue.events.filter(e => e.type === queue.POST_FAILED_EVENT)[0].detail.content, "Keep me");
});

test("a text-only post says Posting, not Uploading, and sends no media fields", async () => {
  const calls = [];
  const queue = loadQueue(async (orgId, payload) => { calls.push(payload); return { id: "p", branchId: null }; });
  await queue.publishPostInBackground(draft({ location: "Lagos, Nigeria" }));

  assert.match(queue.toasts[0].message, /^Posting/);
  assert.equal(calls[0].mediaUrls, undefined);
  assert.equal(calls[0].mediaUrl, undefined);
  assert.match(calls[0].content, /Lagos, Nigeria/, "the location is appended to the body");
});
