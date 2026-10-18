import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";

function compile(path, imports = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, URL, Map, ...globals, require: (key) => { assert.ok(key in imports, key); return imports[key]; } });
  return module.exports;
}
const sharing = compile("../lib/post-sharing.ts");
test("post links retain only the post's branch and identity, not unrelated URL parameters", () => {
  const link = new URL(sharing.buildPostLink("https://wellstaq.example/elsewhere?private=secret", { id: "post-1", branchId: "branch-2" }));
  assert.equal(link.pathname, "/dashboard/space");
  assert.equal(link.searchParams.get("branchId"), "branch-2");
  assert.equal(link.searchParams.get("postId"), "post-1");
  assert.equal(link.hash, "#post-post-1");
  assert.equal(link.searchParams.has("private"), false);
  assert.equal(new URL(sharing.buildPostLink(link.origin, { id: "general", branchId: null })).searchParams.has("branchId"), false);
});
test("social destinations encode the entire post link exactly once", () => {
  const link = "https://wellstaq.example/dashboard/space?branchId=a&postId=b#post-b";
  const result = sharing.getPostShareLinks(link);
  assert.equal(new URL(result.whatsapp).searchParams.get("text"), link);
  assert.equal(new URL(result.facebook).searchParams.get("u"), link);
  assert.equal(new URL(result.linkedin).searchParams.get("url"), link);
  assert.deepEqual(Object.keys(result), ["whatsapp", "facebook", "linkedin"]);
});
test("shared links find older posts, while a normal feed only loads its first page", async () => {
  const offsets = [];
  const load = async (offset) => { offsets.push(offset); return { items: [{ id: String(offset) }], offset, limit: 1, total: 4 }; };
  const result = await sharing.loadFeedThroughPost(load, "2", () => false);
  assert.deepEqual(offsets, [0, 1, 2]);
  assert.equal(result.at(-1).id, "2");
  offsets.length = 0;
  await sharing.loadFeedThroughPost(load, null, () => false);
  assert.deepEqual(offsets, [0]);
});
test("post lookup stops on cancellation, empty pages, exhaustion and non-advancing responses", async () => {
  let calls = 0;
  const load = async (offset) => { calls++; return { items: [{ id: "one" }], offset, total: 2 }; };
  await sharing.loadFeedThroughPost(load, "missing", () => true);
  assert.equal(calls, 1);
  calls = 0;
  await sharing.loadFeedThroughPost(load, "missing", () => false);
  assert.equal(calls, 2);
  calls = 0;
  await sharing.loadFeedThroughPost(async () => { calls++; return { items: [], offset: 0, total: 100 }; }, "missing", () => false);
  assert.equal(calls, 1);
  calls = 0;
  await sharing.loadFeedThroughPost(async () => { calls++; return { items: [{ id: "one" }], offset: 0, total: 100 }; }, "missing", () => false);
  assert.equal(calls, 2);
});

const walk = (node, predicate) => Array.isArray(node) ? node.flatMap(child => walk(child, predicate)) : React.isValidElement(node) ? [...(predicate(node) ? [node] : []), ...walk(node.props.children, predicate)] : [];
function modalFixture(writeText = async () => {}) {
  const state = [], refs = [];
  let cursor = 0, closed = 0;
  const input = { focus() { this.focused = true; }, select() { this.selected = true; } };
  const hooks = {
    useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = value; }]; },
    useRef() { const index = cursor++; return refs[index] ??= { current: input }; },
    useId: () => "share-title", useEffect: () => {},
  };
  const component = compile("../components/space/post-share-modal.tsx", { react: hooks, "react/jsx-runtime": jsxRuntime, "@wellstaq/ui/icons": new Proxy({}, { get: (_, key) => `Icon${key}` }), "@/lib/post-sharing": sharing }, { navigator: { clipboard: { writeText } } });
  let tree;
  const render = () => { cursor = 0; tree = component.PostShareModal({ link: "https://wellstaq.example/dashboard/space?postId=test", onClose: () => closed++ }); };
  render();
  return { render, input, get tree() { return tree; }, get closed() { return closed; }, find: predicate => walk(tree, predicate), button: text => walk(tree, node => node.type === "button" && React.Children.toArray(node.props.children).includes(text))[0] };
}
test("share modal presents safe external destinations and a separate Instagram copy-and-open flow", async () => {
  let copied;
  const ui = modalFixture(async link => { copied = link; });
  assert.equal(ui.tree.type, "dialog");
  assert.equal(ui.find(node => node.type === "a").length, 3);
  for (const link of ui.find(node => node.type === "a")) {
    assert.equal(link.props.target, "_blank");
    assert.equal(link.props.rel, "noopener noreferrer");
  }
  ui.button("Instagram").props.onClick();
  await new Promise(setImmediate); ui.render();
  assert.match(copied, /postId=test/);
  assert.equal(ui.find(node => node.type === "a" && node.props.href === "https://www.instagram.com/").length, 1);
  assert.ok(ui.button("Copied"));
  ui.tree.props.onCancel({ preventDefault() {} });
  assert.equal(ui.closed, 1);
});
test("clipboard rejection offers a selectable link instead of claiming it copied", async () => {
  const ui = modalFixture(async () => { throw Error("Clipboard denied"); });
  ui.button("Copy link").props.onClick();
  await new Promise(setImmediate); ui.render();
  assert.equal(ui.button("Copied"), undefined);
  assert.equal(ui.input.focused, true);
  assert.equal(ui.input.selected, true);
  assert.match(ui.find(node => node.props.role === "status")[0].props.children, /Couldn’t copy automatically/);
});

const media = compile("../lib/media.ts");

/** Renders function components one at a time, each with its own hook frame, so a
 *  card and the comment rows inside it do not share a cursor. */
function postHarness() {
  let frame = null;
  const hooks = {
    useState(initial) {
      const f = frame, i = f.cursor++;
      if (!(i in f.state)) f.state[i] = initial;
      return [f.state[i], (value) => { f.state[i] = typeof value === "function" ? value(f.state[i]) : value; }];
    },
    useRef(initial = null) {
      const f = frame, i = f.cursor++;
      return f.refs[i] ??= { current: f.input ?? initial };
    },
    useEffect() {},
  };
  const component = compile("../components/space/post-section.tsx", {
    react: hooks, "react/jsx-runtime": jsxRuntime,
    // next/image is a default export, so the mock has to sit on `.default`.
    "next/image": { default: "Image" },
    "@wellstaq/ui/icons": new Proxy({}, { get: (_, key) => `Icon${key}` }),
    "@/components/space/story-section": { Avatar: "Avatar" },
    "@/lib/time": { formatRelativeTime: () => "Today" },
    "@/lib/post-sharing": sharing,
    "@/lib/media": media,
    "@/components/space/post-share-modal": { PostShareModal: "PostShareModal" },
    "@/components/ui/filter-dropdown": { FilterDropdown: "FilterDropdown" },
  }, { window: { location: { origin: "https://wellstaq.example" } } });

  const makeFrame = (input = null) => ({ state: [], refs: [], cursor: 0, input });
  const render = (fn, props, f) => { frame = f; f.cursor = 0; return fn(props); };
  return { component, makeFrame, render };
}

const basePost = {
  id: "post-1", branchId: "branch-1", userId: "author", createdAt: "2026-01-01",
  content: "Hello", mediaUrl: null, mediaUrls: null, mediaType: null,
  likeCount: 0, commentCount: 0, shareCount: 0,
};

function baseProps(overrides = {}) {
  return {
    user: { id: "viewer" }, posts: [basePost], postsLoading: false, postContent: "",
    badgeMap: new Map(), likedPostIds: new Set(),
    commentsByPost: {}, expandedComments: [], getMember: () => undefined,
    attachments: [], branches: [], audienceBranchId: null,
    onToggleLike() {}, onToggleComments() {}, onAddComment() {},
    onEditComment() {}, onRequestDeletePost() {}, onRequestDeleteComment() {},
    onHashtagClick() {}, onShared() {}, onAudienceChange() {},
    ...overrides,
  };
}

const buttonLabelled = (tree, text) => walk(tree, node => node.type === "button"
  && React.Children.toArray(node.props.children).some(child => typeof child === "string" && child.trim() === text))[0];

const shape = (value) => JSON.parse(JSON.stringify(value));

test("post cards expose Like, Comment and Share, and Share reports the share so the count can move", () => {
  const { component, makeFrame, render } = postHarness();
  const shared = [];
  const props = baseProps({ onShared: id => shared.push(id) });
  const sectionFrame = makeFrame();
  let tree = render(component.PostsSection, props, sectionFrame);

  const card = walk(tree, node => node.props?.post?.id === basePost.id)[0];
  const content = render(card.type, card.props, makeFrame());

  assert.ok(buttonLabelled(content, "Like") && buttonLabelled(content, "Comment"));
  assert.equal(buttonLabelled(content, "Save"), undefined, "there is no Save action on a post card");
  assert.equal(buttonLabelled(content, "Saved"), undefined);

  walk(content, node => node.type === "button" && node.props["aria-haspopup"] === "dialog")[0].props.onClick();
  tree = render(component.PostsSection, props, sectionFrame);
  const modal = walk(tree, node => node.type === "PostShareModal")[0];
  assert.equal(new URL(modal.props.link).searchParams.get("postId"), "post-1");

  modal.props.onShared();
  assert.deepEqual(shared, ["post-1"], "a completed share must be reported so share_count moves");
  modal.props.onClose();
  tree = render(component.PostsSection, props, sectionFrame);
  assert.equal(walk(tree, node => node.type === "PostShareModal").length, 0);
});

test("a post renders every attachment, typing each from its own URL rather than the post's single media_type", () => {
  const { component, makeFrame, render } = postHarness();
  const post = { ...basePost, mediaUrl: "https://cdn.example/a.jpg", mediaUrls: ["https://cdn.example/a.jpg", "https://cdn.example/b.mp4"], mediaType: "image" };
  const tree = render(component.PostsSection, baseProps({ posts: [post] }), makeFrame());
  const card = walk(tree, node => node.props?.post?.id === post.id)[0];
  const content = render(card.type, card.props, makeFrame());

  const images = walk(content, node => node.type === "Image" && String(node.props.src).startsWith("https://cdn.example"));
  const videos = walk(content, node => node.type === "video" && String(node.props.src).startsWith("https://cdn.example"));
  assert.equal(images.length + videos.length, 2, "both attachments must render");
  assert.deepEqual(videos.map(node => node.props.src), ["https://cdn.example/b.mp4"], "the .mp4 must render as video even though media_type says image");
});

test("a post with only the legacy single media_url still renders it", () => {
  const { component, makeFrame, render } = postHarness();
  const post = { ...basePost, mediaUrl: "https://cdn.example/legacy.png", mediaUrls: null, mediaType: "image" };
  const tree = render(component.PostsSection, baseProps({ posts: [post] }), makeFrame());
  const card = walk(tree, node => node.props?.post?.id === post.id)[0];
  const content = render(card.type, card.props, makeFrame());
  assert.equal(walk(content, node => node.type === "Image" && node.props.src === "https://cdn.example/legacy.png").length, 1);
});

test("replying to a reply sends the top-level comment id, never the reply's own id", () => {
  const { component, makeFrame, render } = postHarness();
  const reply = { id: "reply-1", postId: "post-1", userId: "other", content: "A reply", parentCommentId: "comment-1", createdAt: "2026-01-01", updatedAt: "2026-01-01" };
  const comment = { id: "comment-1", postId: "post-1", userId: "other", content: "Top level", parentCommentId: null, createdAt: "2026-01-01", updatedAt: "2026-01-01", replies: [reply] };
  const added = [];
  const props = baseProps({
    posts: [{ ...basePost, commentCount: 2 }],
    commentsByPost: { "post-1": [comment] },
    expandedComments: ["post-1"],
    onAddComment: (postId, content, parentCommentId) => added.push([postId, content, parentCommentId]),
  });

  const tree = render(component.PostsSection, props, makeFrame());
  const card = walk(tree, node => node.props?.post?.id === "post-1")[0];
  const input = { value: "", focus() {} };
  const cardFrame = makeFrame(input);
  let content = render(card.type, card.props, cardFrame);

  const replyRow = walk(content, node => typeof node.type === "function" && node.props.comment?.id === "reply-1")[0];
  assert.ok(replyRow, "the reply must render under its parent");
  const rendered = render(replyRow.type, replyRow.props, makeFrame());
  buttonLabelled(rendered, "Reply").props.onClick();

  content = render(card.type, card.props, cardFrame);
  input.value = "Replying to the reply";
  walk(content, node => node.type === "button" && node.props["aria-label"] === "Send comment")[0].props.onClick();

  assert.deepEqual(added, [["post-1", "Replying to the reply", "comment-1"]]);
});

test("a top-level comment replies to itself, and editing a reply targets the reply", () => {
  const { component, makeFrame, render } = postHarness();
  const comment = { id: "comment-1", postId: "post-1", userId: "other", content: "Top level", parentCommentId: null, createdAt: "2026-01-01", updatedAt: "2026-01-01", replies: [] };
  const added = [], edited = [];
  const props = baseProps({
    commentsByPost: { "post-1": [comment] },
    expandedComments: ["post-1"],
    onAddComment: (postId, content, parentCommentId) => added.push(parentCommentId),
    onEditComment: (postId, commentId, content) => edited.push([commentId, content]),
  });
  const tree = render(component.PostsSection, props, makeFrame());
  const card = walk(tree, node => node.props?.post?.id === "post-1")[0];
  const input = { value: "", focus() {} };
  const cardFrame = makeFrame(input);
  let content = render(card.type, card.props, cardFrame);

  const row = walk(content, node => typeof node.type === "function" && node.props.comment?.id === "comment-1")[0];
  render(row.type, row.props, makeFrame());
  buttonLabelled(render(row.type, row.props, makeFrame()), "Reply").props.onClick();
  content = render(card.type, card.props, cardFrame);
  input.value = "A first reply";
  walk(content, node => node.type === "button" && node.props["aria-label"] === "Send comment")[0].props.onClick();
  assert.deepEqual(added, ["comment-1"]);

  row.props.onEdit("Edited text");
  assert.deepEqual(edited, [["comment-1", "Edited text"]]);
});

test("the composer offers an explicit audience that starts at Everyone and is not inferred from the feed", () => {
  const { component, makeFrame, render } = postHarness();
  const chosen = [];
  const branches = [{ id: "branch-1", name: "Lagos" }, { id: "branch-2", name: "Abuja" }];
  const tree = render(component.PostsSection, baseProps({ branches, onAudienceChange: value => chosen.push(value) }), makeFrame());
  const box = walk(tree, node => typeof node.type === "function" && node.props.audienceBranchId !== undefined)[0];
  assert.equal(box.props.audienceBranchId, null, "the audience defaults to Everyone");

  const composer = render(box.type, box.props, makeFrame());
  const dropdown = walk(composer, node => node.type === "FilterDropdown" && node.props.ariaLabel === "Post audience")[0];
  assert.ok(dropdown, "the composer offers an audience dropdown");
  assert.equal(dropdown.props.value, "", "it starts on Everyone");
  assert.deepEqual(shape(dropdown.props.options.map(option => option.value)), ["", "branch-1", "branch-2"]);
  dropdown.props.onValueChange("");
  dropdown.props.onValueChange("branch-2");
  assert.deepEqual(chosen, [null, "branch-2"], "Everyone must come through as null, so branch_id is sent as null");

  const fileInput = walk(composer, node => node.type === "input" && node.props.type === "file")[0];
  assert.equal(fileInput.props.accept, "image/*,video/*", "video must be selectable, not just images");
  assert.equal(fileInput.props.multiple, true, "several attachments must be selectable at once");
});

test("a post is labelled with where it was published, not the author's email address", () => {
  const { component, makeFrame, render } = postHarness();
  const author = { id: "author", firstName: "Yemi", lastName: "Sage", email: "yemi@example.com", avatarUrl: null };
  const branches = [{ id: "branch-1", name: "Lagos Branch" }];
  const subtitleOf = (post) => {
    const tree = render(component.PostsSection, baseProps({ posts: [post], branches, getMember: () => author }), makeFrame());
    const card = walk(tree, node => node.props?.post?.id === post.id)[0];
    const content = render(card.type, card.props, makeFrame());
    const lines = walk(content, node => node.type === "p")
      .map(node => React.Children.toArray(node.props.children).filter(child => typeof child === "string").join(""));
    return { lines, all: lines.join(" | ") };
  };

  const branchPost = subtitleOf({ ...basePost, branchId: "branch-1" });
  assert.ok(branchPost.lines.includes("Lagos Branch · Today"), `expected the branch name, got: ${branchPost.all}`);

  const orgPost = subtitleOf({ ...basePost, id: "post-2", branchId: null });
  assert.ok(orgPost.lines.includes("General · Today"), `expected General for an org-wide post, got: ${orgPost.all}`);

  assert.equal(branchPost.all.includes(author.email), false, "the author's email address must not appear on the card");
});
