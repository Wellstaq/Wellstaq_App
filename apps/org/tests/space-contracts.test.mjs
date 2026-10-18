import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function compile(path, imports = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  // Named `mod`, not `module`: Next's lint forbids assigning to `module`.
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports, URL, URLSearchParams, Map, Set, Date, Math, JSON, console,
    ...globals,
    require: (key) => { assert.ok(key in imports, key); return imports[key]; },
  });
  return mod.exports;
}

/** Values built inside the VM realm carry that realm's prototypes, which strict
 *  deepEqual rejects. Compare their shape instead. */
const shape = (value) => JSON.parse(JSON.stringify(value));

// ── What goes on the wire ────────────────────────────────────────────────
function apiFixture(response = {}) {
  const calls = [];
  const api = compile("../services/api.ts", {
    "@/services/http": {
      request: (path, options) => { calls.push({ path, options: options ?? {} }); return Promise.resolve(typeof response === "function" ? response(path, options) : response); },
      ApiError: class ApiError extends Error {},
    },
    "@/services/config": { backendPath: (path) => path },
    "@/services/auth-token": { getAuthTokens: () => null, clearAuthTokens: () => {} },
  });
  return { api: api.api, calls, last: () => calls[calls.length - 1] };
}

test("notification read requests carry no body at all — sending {} fails the request", async () => {
  const { api, last } = apiFixture();
  await api.notifications.markRead("notification-1");
  assert.equal(last().path, "/notifications/notification-1/read");
  assert.equal(last().options.method, "PATCH");
  assert.equal("body" in last().options, false, "PATCH /{id}/read declares no body");

  await api.notifications.markAllRead();
  assert.equal(last().path, "/notifications/read-all");
  assert.equal("body" in last().options, false, "PATCH /read-all declares no body");
});

test("sharing a post posts to /share with a body, because that endpoint requires one", async () => {
  const { api, last } = apiFixture();
  await api.post.sharePost("org-1", "post-1");
  assert.equal(last().path, "/organizations/org-1/posts/post-1/share");
  assert.equal(last().options.method, "POST");
  assert.deepEqual(shape(last().options.body), {}, "ShareCreateRequest is required, and all its fields are nullable");
});

test("a post sends every attachment in media_urls without the mutually exclusive media_url", async () => {
  const { api, last } = apiFixture();
  await api.post.createPost("org-1", {
    branchId: null,
    content: "Hello",
    mediaUrls: ["https://cdn.example/a.jpg", "https://cdn.example/b.mp4"],
    mediaUrl: "https://cdn.example/a.jpg",
    mediaType: "image",
  });
  const body = last().options.body;
  assert.deepEqual(body.media_urls, ["https://cdn.example/a.jpg", "https://cdn.example/b.mp4"]);
  assert.equal("media_url" in shape(body), false, "the API rejects requests containing both media formats");
});

test("posting to Everyone sends branch_id: null rather than omitting it", async () => {
  const { api, last } = apiFixture();
  await api.post.createPost("org-1", { branchId: null, content: "Company-wide" });
  assert.equal(last().options.body.branch_id, null);
  assert.equal("branch_id" in last().options.body, true, "an omitted key would leave the audience to the server");

  await api.post.createPost("org-1", { branchId: "branch-7", content: "Branch only" });
  assert.equal(last().options.body.branch_id, "branch-7");

  await api.story.createStory("org-1", { branchId: null, mediaUrl: "u", mediaType: "image" });
  assert.equal(last().options.body.branch_id, null, "the story composer has the same audience rule");
});

test("a post with no attachments sends no media_urls, and a video keeps its own type", async () => {
  const { api, last } = apiFixture();
  await api.post.createPost("org-1", { branchId: null, content: "Text only" });
  assert.equal(last().options.body.media_urls, undefined);
  assert.equal(last().options.body.media_url, undefined);

  await api.post.createPost("org-1", { branchId: null, mediaUrls: ["https://cdn.example/clip.mp4"], mediaType: "video" });
  assert.equal(last().options.body.media_type, "video");
});

test("a comment sends parent_comment_id only for replies", async () => {
  const { api, last } = apiFixture();
  await api.post.addComment("org-1", "post-1", "Top level");
  assert.equal(last().options.body.parent_comment_id, null);

  await api.post.addComment("org-1", "post-1", "A reply", "comment-1");
  assert.equal(last().options.body.parent_comment_id, "comment-1");
});

test("story likes and comment edits reach the endpoints they claim to", async () => {
  const { api, last } = apiFixture();
  await api.story.likeStory("org-1", "story-1");
  assert.equal(last().path, "/organizations/org-1/stories/story-1/like");
  assert.equal(last().options.method, "POST");

  await api.story.unlikeStory("org-1", "story-1");
  assert.equal(last().options.method, "DELETE");

  await api.post.editComment("org-1", "post-1", "comment-1", "Edited");
  assert.equal(last().path, "/organizations/org-1/posts/post-1/comments/comment-1");
  assert.equal(last().options.method, "PATCH");
  assert.deepEqual(shape(last().options.body), { content: "Edited" });

  await api.post.savePost("org-1", "post-1");
  assert.equal(last().path, "/organizations/org-1/posts/post-1/save");
  assert.equal(last().options.method, "POST");
  await api.post.unsavePost("org-1", "post-1");
  assert.equal(last().options.method, "DELETE");
});

// ── Uploads are refused at the picker, by name ───────────────────────────
const media = compile("../lib/media.ts");
const file = (name, type, size) => ({ name, type, size });

test("an unsupported or oversized file is refused before any upload starts, and names itself", () => {
  const good = file("photo.jpg", "image/jpeg", 1024);
  assert.equal(media.findUploadRejection([good]), null);

  const oversized = file("holiday.mp4", "video/mp4", media.MAX_UPLOAD_BYTES + 1);
  const tooBig = media.findUploadRejection([good, oversized]);
  assert.ok(tooBig, "the batch must be rejected");
  assert.equal(tooBig.file, oversized);
  assert.match(tooBig.reason, /holiday\.mp4/, "the message must name the offending file");

  const wrongType = media.findUploadRejection([good, file("contract.pdf", "application/pdf", 10)]);
  assert.match(wrongType.reason, /contract\.pdf/);

  assert.equal(media.findUploadRejection([file("clip.mov", "video/quicktime", 10)], { allow: ["image"] }).file.name, "clip.mov");
});

test("media type is read from the file, never assumed from the picker", () => {
  assert.equal(media.mediaKindOf(file("a.mp4", "video/mp4", 1)), "video");
  assert.equal(media.mediaKindOf(file("a.png", "image/png", 1)), "image");
  assert.equal(media.mediaKindOf(file("a.pdf", "application/pdf", 1)), null);
});

// ── Notification vocabulary ──────────────────────────────────────────────
const notifications = compile("../lib/notifications.ts");
const notification = (overrides = {}) => ({
  id: "n1", organizationId: "org-1", actorId: null, notificationType: "generic",
  referenceId: null, referenceType: null, body: "Something happened",
  imageUrl: null, isRead: false, readAt: null, createdAt: "2026-01-01T09:00:00Z",
  ...overrides,
});

test("categories match most specific first, so challenge_comment is a Challenge, not a Post", () => {
  assert.equal(notifications.notificationCategory(notification({ notificationType: "challenge_comment" })), "challenges");
  assert.equal(notifications.notificationCategory(notification({ notificationType: "post_comment" })), "posts");
  assert.equal(notifications.notificationCategory(notification({ notificationType: "event_reminder" })), "events");
  assert.equal(notifications.notificationCategory(notification({ notificationType: "new_login_detected" })), "security");
});

test("an unrecognised notification type is never hidden — it has no category and stays under All", () => {
  assert.equal(notifications.notificationCategory(notification({ notificationType: "something_new_the_api_added" })), null);
});

test("every reference type the app can open deep-links somewhere real, and the rest are not links", () => {
  const href = (referenceType, referenceId = "abc") => notifications.notificationHref(notification({ referenceType, referenceId }));
  assert.equal(href("event"), "/dashboard/events/abc");
  assert.equal(href("challenge"), "/dashboard/challenges/abc");
  assert.equal(href("club"), "/dashboard/clubs?clubId=abc");
  assert.equal(href("story"), "/dashboard/space?storyId=abc");
  assert.equal(href("post"), "/dashboard/space?postId=abc#post-abc");
  assert.equal(href("comment"), "/dashboard/space?postId=abc#post-abc", "a comment leads to the post it is on");
  assert.equal(href("unknown_thing"), null, "unrecognised references must render as plain text, not a dead link");
  assert.equal(notifications.notificationHref(notification({ referenceType: "post", referenceId: null })), null);
});

test("the actor's avatar is used only when someone acted on you", () => {
  assert.equal(notifications.isActorDriven(notification({ actorId: "u1", notificationType: "post_like" })), true);
  assert.equal(notifications.isActorDriven(notification({ actorId: "u1", notificationType: "comment_reply" })), true);
  assert.equal(notifications.isActorDriven(notification({ actorId: null, notificationType: "post_like" })), false);
  assert.equal(notifications.isActorDriven(notification({ actorId: "u1", notificationType: "event_reminder" })), false);
});

test("the actor's name is not repeated when it is already the row heading", () => {
  assert.equal(notifications.stripActorName("Yemi liked your post", "Yemi"), "Liked your post");
  assert.equal(notifications.stripActorName("Yemi Sage commented on your post", "Yemi Sage"), "Commented on your post");
  assert.equal(notifications.stripActorName("Your challenge starts tomorrow", "Yemi"), "Your challenge starts tomorrow");
  assert.equal(notifications.stripActorName("Yemi", "Yemi"), "Yemi", "never blank out the whole body");
});

test("notifications are grouped by day, newest group first", () => {
  const now = new Date("2026-03-10T12:00:00");
  const items = [
    notification({ id: "a", createdAt: "2026-03-10T09:00:00" }),
    notification({ id: "b", createdAt: "2026-03-10T08:00:00" }),
    notification({ id: "c", createdAt: "2026-03-09T20:00:00" }),
    notification({ id: "d", createdAt: "2026-02-02T20:00:00" }),
  ];
  const groups = notifications.groupByDay(items, now);
  assert.deepEqual(shape(groups.map(group => group.label)).slice(0, 2), ["Today", "Yesterday"]);
  assert.deepEqual(shape(groups[0].items.map(item => item.id)), ["a", "b"]);
  assert.equal(groups.length, 3);
  assert.equal(groups.flatMap(group => group.items).length, items.length, "no notification may be dropped by grouping");
});


test("legacy single-image callers send only media_url", async () => {
 const { api, last } = apiFixture();
 await api.post.createPost("org-1", { branchId: null, mediaUrl: "https://cdn.example/photo.jpg", mediaType: "image" });
 const body = shape(last().options.body);
 assert.equal(body.media_url, "https://cdn.example/photo.jpg");
 assert.equal("media_urls" in body, false);
});


test("event metrics load every page in branch scope, not just the visible eight records", async () => {
 const entries = Array.from({ length: 105 }, (_, id) => ({ id: String(id), title: "Event " + id, status: id < 100 ? "scheduled" : "completed" }));
 const { api, calls } = apiFixture(path => {
  const url = new URL(path, "https://example.test");
  const offset = Number(url.searchParams.get("offset"));
  assert.equal(url.searchParams.get("branch_id"), "branch-1");
  return { items: entries.slice(offset, offset + 100), total: entries.length, offset, limit: 100 };
 });
 const result = await api.organization.getAllEvents("org-1", "branch-1");
 assert.equal(result.length, 105);
 assert.equal(result.filter(event => event.status === "completed").length, 5);
 assert.equal(calls.length, 2);
});
test("missing KPI values stay unavailable while genuine zeroes remain zero", async () => {
 const { api } = apiFixture({ summary: { averageDailySteps: { value: null, change: null }, healthScore: { value: null, change: null }, activeEmployees: { value: null, change: null }, challengesWon: { value: 0, change: 0 } } });
 const { summary } = await api.kpiSnapshots.getOverview("org-1");
 assert.equal(summary.healthScore, "Unavailable");
 assert.equal(summary.activeEmployees, "Unavailable");
 assert.equal(summary.healthScoreTrend, "");
 assert.equal(summary.challengesWon, "0");
});
