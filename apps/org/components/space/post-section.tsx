"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ImageIcon, Video, MapPin, Send, Heart, MessageCircle, Share2, Trash2, X, Loader2,
  Check, CornerDownRight, type IconComponent,
} from "@wellstaq/ui/icons";
import type { Post, Comment, CommentReply, OrganizationMemberInfo } from "@/types/api";
import { MAX_POST_ATTACHMENTS, looksLikeVideo, postMediaUrls, type PostAttachment } from "@/lib/media";
import { Avatar } from "@/components/space/story-section";
import { formatRelativeTime } from "@/lib/time";
import { buildPostLink } from "@/lib/post-sharing";
import { PostShareModal } from "@/components/space/post-share-modal";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

interface Badge { icon: IconComponent; label: string; rank: number; }

const HASHTAG_PATTERN = /#[\w-]+/g;

/** Splits post content into plain text + clickable hashtag spans. */
function renderContentWithHashtags(content: string, onHashtagClick: (tag: string) => void) {
  const parts = content.split(HASHTAG_PATTERN);
  const tags = content.match(HASHTAG_PATTERN) ?? [];
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, i) => {
    if (part) nodes.push(<span key={`t-${i}`}>{part}</span>);
    if (tags[i]) {
      const tag = tags[i];
      nodes.push(
        <button
          key={`h-${i}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHashtagClick(tag);
          }}
          className="text-primary-1 font-medium hover:underline"
        >
          {tag}
        </button>,
      );
    }
  });

  return nodes;
}

// ── Create Post box ─────────────────────────────────────────────────────
function CreatePostBox({
  user,
  placeholder,
  postContent,
  onContentChange,
  attachments,
  onMediaSelect,
  onRemoveAttachment,
  postLocation,
  onShareLocation,
  onClearLocation,
  audienceBranchId,
  branches,
  onAudienceChange,
  onSubmit,
  canSubmit,
}: {
  user: { avatarUrl?: string; firstName?: string; lastName?: string; id: string };
  placeholder: string;
  postContent: string;
  onContentChange: (v: string) => void;
  attachments: PostAttachment[];
  onMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  postLocation: string | null;
  onShareLocation: () => void;
  onClearLocation: () => void;
  audienceBranchId: string | null;
  branches: Array<{ id: string; name: string }>;
  onAudienceChange: (branchId: string | null) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}) {
  const atAttachmentLimit = attachments.length >= MAX_POST_ATTACHMENTS;
  return (
    <div data-tour="post-composer" className="bg-white p-4 rounded-[8px] border border-grey-4">
      <div className="flex gap-3 mb-4">
        <Avatar url={user.avatarUrl} seed={user.id} firstName={user.firstName} lastName={user.lastName} size={40} showPlaceholderBadge />
        <div className="flex-1">
          <textarea
            placeholder={placeholder}
            className="w-full resize-none outline-none text-sm pt-2 text-grey-1 placeholder:text-grey-3"
            rows={2}
            value={postContent}
            onChange={(e) => onContentChange(e.target.value)}
          />
          {attachments.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="relative h-24 overflow-hidden rounded-lg border border-grey-4 bg-grey-5">
                  {attachment.kind === "video" ? (
                    <video src={attachment.previewUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <Image src={attachment.previewUrl} alt={attachment.name} fill unoptimized className="object-cover" />
                  )}
                  {!attachment.mediaUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    aria-label={`Remove ${attachment.name}`}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {postLocation && (
            <div className="flex items-center justify-start gap-2 text-xs text-primary-1 mt-2 bg-primary-5 px-2 py-1 rounded-md w-fit">
              <MapPin className="w-3 h-3" /> {postLocation}
              <button onClick={onClearLocation} className="hover:text-primary-2"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-grey-4">
        <div className="flex items-center gap-4">
          {/* One input for both: the media type is derived from each file, never
              assumed from which icon was clicked. */}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            id="post-media-input"
            className="hidden"
            onChange={onMediaSelect}
            disabled={atAttachmentLimit}
          />
          <label
            htmlFor="post-media-input"
            aria-disabled={atAttachmentLimit}
            title={atAttachmentLimit ? `You can attach up to ${MAX_POST_ATTACHMENTS} files.` : "Add photos"}
            className={`text-grey-2 hover:text-grey-1 ${atAttachmentLimit ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
          >
            <ImageIcon className="w-5 h-5" />
          </label>
          <label
            htmlFor="post-media-input"
            aria-disabled={atAttachmentLimit}
            title={atAttachmentLimit ? `You can attach up to ${MAX_POST_ATTACHMENTS} files.` : "Add a video"}
            className={`text-grey-2 hover:text-grey-1 ${atAttachmentLimit ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
          >
            <Video className="w-5 h-5" />
          </label>
          <button type="button" onClick={onShareLocation} className="text-grey-2 hover:text-grey-1"><MapPin className="w-5 h-5" /></button>
          {attachments.length > 0 && (
            <span className="text-xs text-grey-3">{attachments.length}/{MAX_POST_ATTACHMENTS}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Audience is chosen, never inferred from the feed being viewed. */}
          <FilterDropdown
            ariaLabel="Post audience"
            align="right"
            value={audienceBranchId ?? ""}
            options={[{ label: "Everyone", value: "" }, ...branches.map((branch) => ({ label: branch.name, value: branch.id }))]}
            onValueChange={(value) => onAudienceChange(value || null)}
            className="max-w-[180px]"
            buttonClassName="h-9 gap-1.5 border-0 bg-transparent px-2 text-xs font-normal"
          />
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="px-6 py-2 bg-primary-5 text-primary-1 font-medium text-sm rounded-lg hover:bg-primary-1 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Post
          </button>
        </div>
      </div>
    </div>
  );
}

function memberName(member: OrganizationMemberInfo | undefined, isMine: boolean) {
  if (isMine) return "You";
  return member ? `${member.firstName} ${member.lastName}` : "Member";
}

// ── One comment or reply, with inline edit ──────────────────────────────
function CommentRow({
  comment,
  author,
  isMine,
  isReply = false,
  onStartReply,
  onEdit,
  onDelete,
}: {
  comment: Comment | CommentReply;
  author: OrganizationMemberInfo | undefined;
  isMine: boolean;
  isReply?: boolean;
  onStartReply: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const next = draft?.trim();
    if (next && next !== comment.content) onEdit(next);
    setDraft(null);
  };
  // Time and actions sit on a meta row under the bubble rather than inside it.
  // Inside, a justify-between header stranded the timestamp against the far
  // edge on a wide column and wrapped both it and the name on a narrow one.
  const metaAction = "font-medium text-grey-3 transition-colors hover:text-primary-1";
  return (
    <div className="flex gap-2.5">
      <Avatar url={author?.avatarUrl} seed={comment.userId} firstName={author?.firstName} lastName={author?.lastName} size={isReply ? 28 : 32} showPlaceholderBadge />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-grey-5 px-3 py-2">
          <p className="truncate text-[13px] font-semibold leading-5 text-grey-1">{memberName(author, isMine)}</p>
          {draft === null ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-grey-2">{comment.content}</p>
          ) : (
            <div className="mt-1 flex items-center gap-1.5">
              <input
                autoFocus
                value={draft}
                aria-label="Edit comment"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") setDraft(null);
                }}
                className="min-w-0 flex-1 rounded-lg border border-grey-4 bg-white px-2 py-1 text-sm text-grey-1 focus:border-primary-1 focus:outline-none"
              />
              <button type="button" aria-label="Save comment" onClick={commit} className="shrink-0 text-primary-1"><Check className="w-4 h-4" /></button>
              <button type="button" aria-label="Cancel edit" onClick={() => setDraft(null)} className="shrink-0 text-grey-3"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-3 text-[11px] leading-4 text-grey-3">
          <span className="whitespace-nowrap">{formatRelativeTime(comment.createdAt)}</span>
          <button type="button" onClick={onStartReply} className={metaAction}>Reply</button>
          {isMine && draft === null && (
            <>
              <button type="button" onClick={() => setDraft(comment.content ?? "")} className={metaAction}>Edit</button>
              <button type="button" onClick={onDelete} className="font-medium text-grey-3 transition-colors hover:text-red-500">Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Single post card (with inline comments) ─────────────────────────────
function PostCard({
  post,
  user,
  author,
  badge,
  branchLabel,
  isLiked,
  comments,
  commentsExpanded,
  getMember,
  onToggleLike,
  onToggleComments,
  onAddComment,
  onEditComment,
  onDeletePost,
  onDeleteComment,
  onHashtagClick,
  onShare,
}: {
  post: Post;
  user: { id: string; avatarUrl?: string; firstName?: string; lastName?: string };
  author: OrganizationMemberInfo | undefined;
  badge: Badge | undefined;
  /** Where the post was published — a branch name, or "General" for org-wide. */
  branchLabel: string | null;
  isLiked: boolean;
  comments: Comment[];
  commentsExpanded: boolean;
  getMember: (userId: string) => OrganizationMemberInfo | undefined;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onAddComment: (content: string, parentCommentId?: string) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeletePost: () => void;
  onDeleteComment: (commentId: string) => void;
  onHashtagClick: (tag: string) => void;
  onShare: () => void;
}) {
  const isMine = post.userId === user.id;
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const mediaItems = postMediaUrls(post).map((url) => ({ url, isVideo: looksLikeVideo(url, post.mediaType) }));

  const startReply = (parentId: string, name: string) => {
    setReplyTo({ id: parentId, name });
    commentInputRef.current?.focus();
  };

  const submitComment = () => {
    const input = commentInputRef.current;
    const value = input?.value.trim();
    if (!value) return;
    onAddComment(value, replyTo?.id);
    if (input) input.value = "";
    setReplyTo(null);
  };
  return (
    <div id={`post-${post.id}`} className="scroll-mt-4 bg-white rounded-[12px] border border-grey-4 overflow-hidden target:ring-2 target:ring-grey-3">
      <div className="p-4 pb-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar url={author?.avatarUrl} seed={post.userId} firstName={author?.firstName} lastName={author?.lastName} size={40} showPlaceholderBadge />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-grey-1">{author ? `${author.firstName} ${author.lastName}` : "Member"}</h3>
                {badge && (
                  <span className="text-[10px] font-medium text-primary-1 bg-primary-5 px-2 py-0.5 rounded-full flex items-center justify-start gap-2">
                    <badge.icon className="inline-block h-3 w-3 shrink-0" aria-hidden="true" /> #{badge.rank} {badge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-grey-3">{branchLabel ? `${branchLabel} · ` : ""}{formatRelativeTime(post.createdAt)}</p>
            </div>
          </div>
          {isMine && (
            <button onClick={onDeletePost} className="text-grey-3 hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {post.content && (
          <p className="text-sm text-grey-1 mb-4 leading-relaxed whitespace-pre-wrap">
            {renderContentWithHashtags(post.content, onHashtagClick)}
          </p>
        )}
      </div>

      {mediaItems.length === 1 && (
        <div className="relative w-full h-[400px]">
          {mediaItems[0].isVideo ? (
            <video src={mediaItems[0].url} controls playsInline className="h-full w-full bg-black object-contain" />
          ) : (
            <Image src={mediaItems[0].url} alt="Post attachment" fill className="object-cover" referrerPolicy="no-referrer" />
          )}
        </div>
      )}

      {mediaItems.length > 1 && (
        <div className="grid grid-cols-2 gap-1">
          {mediaItems.map((item, index) => (
            <div key={`${item.url}-${index}`} className="relative aspect-square bg-grey-5">
              {item.isVideo ? (
                <video src={item.url} controls playsInline className="h-full w-full bg-black object-contain" />
              ) : (
                <Image src={item.url} alt={`Post attachment ${index + 1}`} fill className="object-cover" referrerPolicy="no-referrer" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-grey-2 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-1 flex items-center justify-center border border-white">
              <Heart className="w-2.5 h-2.5 text-white fill-white" />
            </div>
            <span>{post.likeCount} likes</span>
          </div>
          <div className="flex gap-3">
            <span>{post.commentCount} comments</span>
            <span>{post.shareCount} shares</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-b border-grey-4 mb-4">
          <button onClick={onToggleLike} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${isLiked ? "text-primary-1" : "text-grey-2 hover:bg-grey-5 rounded-lg"}`}>
            <Heart className={`w-5 h-5 ${isLiked ? "fill-primary-1" : ""}`} /> Like
          </button>
          <button onClick={onToggleComments} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-grey-2 hover:bg-grey-5 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5" /> Comment
          </button>
          <button type="button" onClick={onShare} aria-haspopup="dialog" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-grey-2 hover:bg-grey-5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1">
            <Share2 className="w-5 h-5" /> Share
          </button>
        </div>

        {commentsExpanded && comments.length > 0 && (
          <div className="mb-4 space-y-4">
            {comments.map((comment) => {
              const cAuthor = getMember(comment.userId);
              return (
                <div key={comment.id} className="space-y-3">
                  <CommentRow
                    comment={comment}
                    author={cAuthor}
                    isMine={comment.userId === user.id}
                    onStartReply={() => startReply(comment.id, memberName(cAuthor, comment.userId === user.id))}
                    onEdit={(content) => onEditComment(comment.id, content)}
                    onDelete={() => onDeleteComment(comment.id)}
                  />
                  {comment.replies && comment.replies.length > 0 && (
                    /* 42px = the parent's 32px avatar + its 10px gap, so a reply
                       lines up with the bubble it belongs to. */
                    <div className="ml-[42px] space-y-3">
                      {comment.replies.map((reply) => {
                        const rAuthor = getMember(reply.userId);
                        return (
                          <CommentRow
                            key={reply.id}
                            comment={reply}
                            author={rAuthor}
                            isMine={reply.userId === user.id}
                            isReply
                            /* Replies are one level deep: replying to a reply must
                               target its top-level parent, never the reply's own id. */
                            onStartReply={() => startReply(reply.parentCommentId ?? comment.id, memberName(rAuthor, reply.userId === user.id))}
                            onEdit={(content) => onEditComment(reply.id, content)}
                            onDelete={() => onDeleteComment(reply.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {replyTo && (
            <div className="flex w-fit items-center justify-start gap-2 rounded-full bg-primary-5 px-3 py-1 text-xs text-primary-1">
              <CornerDownRight className="w-3 h-3" />
              Replying to {replyTo.name}
              <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)} className="hover:text-primary-2">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Avatar url={user.avatarUrl} seed={user.id} firstName={user.firstName} lastName={user.lastName} size={32} showPlaceholderBadge />
            <div className="flex-1 relative">
              <input
                ref={commentInputRef}
                type="text"
                aria-label={replyTo ? `Reply to ${replyTo.name}` : "Write a comment"}
                placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
                className="w-full pl-4 pr-10 py-2 bg-white border border-grey-4 rounded-full text-sm focus:outline-none focus:border-primary-1 focus:ring-1 focus:ring-primary-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitComment();
                  if (e.key === "Escape") setReplyTo(null);
                }}
              />
              <button type="button" aria-label="Send comment" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-1" onClick={submitComment}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section — feed header, create box, list of cards ─────────────────────
export function PostsSection({
  user,
  posts,
  postsLoading,
  feedNotice,
  sharedPostId = null,
  getMember,
  badgeMap,
  likedPostIds,
  commentsByPost,
  expandedComments,
  postContent,
  onContentChange,
  attachments,
  onMediaSelect,
  onRemoveAttachment,
  postLocation,
  onShareLocation,
  onClearLocation,
  audienceBranchId,
  branches,
  onAudienceChange,
  onSubmitPost,
  placeholder,
  onToggleLike,
  onToggleComments,
  onAddComment,
  onEditComment,
  onRequestDeletePost,
  onRequestDeleteComment,
  onHashtagClick,
  onShared,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: {
  user: { id: string; avatarUrl?: string; firstName?: string; lastName?: string };
  posts: Post[];
  postsLoading: boolean;
  feedNotice?: React.ReactNode;
  sharedPostId?: string | null;
  getMember: (userId: string) => OrganizationMemberInfo | undefined;
  badgeMap: Map<string, Badge>;
  likedPostIds: Set<string>;
  commentsByPost: Record<string, Comment[]>;
  expandedComments: string[];
  postContent: string;
  onContentChange: (v: string) => void;
  attachments: PostAttachment[];
  onMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  postLocation: string | null;
  onShareLocation: () => void;
  onClearLocation: () => void;
  audienceBranchId: string | null;
  branches: Array<{ id: string; name: string }>;
  onAudienceChange: (branchId: string | null) => void;
  onSubmitPost: () => void;
  placeholder: string;
  onToggleLike: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentCommentId?: string) => void;
  onEditComment: (postId: string, commentId: string, content: string) => void;
  onRequestDeletePost: (postId: string) => void;
  onRequestDeleteComment: (postId: string, commentId: string) => void;
  onHashtagClick: (tag: string) => void;
  onShared: (postId: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const [shareTarget, setShareTarget] = useState<{ postId: string; link: string } | null>(null);
  const branchNames = new Map(branches.map((branch) => [branch.id, branch.name]));
  const scrolledPost = useRef<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Prefetch the next page before the list runs out, rather than waiting for the
  // reader to hit the very bottom.
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { rootMargin: "600px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, posts.length]);
  useEffect(() => {
    if (postsLoading) { scrolledPost.current = null; return; }
    if (!sharedPostId || scrolledPost.current === sharedPostId) return;
    const card = document.getElementById(`post-${sharedPostId}`);
    if (card) {
      card.scrollIntoView({ block: "start", behavior: "instant" });
      scrolledPost.current = sharedPostId;
    }
  }, [posts, postsLoading, sharedPostId]);
  return (
    <>
    <div className="w-full space-y-6">
      {!postsLoading && sharedPostId && !posts.some((post) => post.id === sharedPostId) && (
        <p role="status" className="rounded-lg border border-grey-4 bg-white p-4 text-sm text-grey-2">This shared post isn’t available in this feed. It may have been removed, or you may need access to its organization or branch.</p>
      )}
      <CreatePostBox
        user={user}
        placeholder={placeholder}
        postContent={postContent}
        onContentChange={onContentChange}
        attachments={attachments}
        onMediaSelect={onMediaSelect}
        onRemoveAttachment={onRemoveAttachment}
        postLocation={postLocation}
        onShareLocation={onShareLocation}
        onClearLocation={onClearLocation}
        audienceBranchId={audienceBranchId}
        branches={branches}
        onAudienceChange={onAudienceChange}
        onSubmit={onSubmitPost}
        canSubmit={!!(postContent.trim() || attachments.length > 0 || postLocation)}
      />

      {feedNotice}
      {postsLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-grey-5 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!postsLoading && posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          user={user}
          author={getMember(post.userId)}
          badge={badgeMap.get(post.userId)}
          branchLabel={post.branchId ? branchNames.get(post.branchId) ?? null : "General"}
          isLiked={likedPostIds.has(post.id)}
          comments={commentsByPost[post.id] ?? []}
          commentsExpanded={expandedComments.includes(post.id)}
          getMember={getMember}
          onToggleLike={() => onToggleLike(post.id)}
          onToggleComments={() => onToggleComments(post.id)}
          onAddComment={(content, parentCommentId) => onAddComment(post.id, content, parentCommentId)}
          onEditComment={(commentId, content) => onEditComment(post.id, commentId, content)}
          onDeletePost={() => onRequestDeletePost(post.id)}
          onDeleteComment={(commentId) => onRequestDeleteComment(post.id, commentId)}
          onHashtagClick={onHashtagClick}
          onShare={() => setShareTarget({ postId: post.id, link: buildPostLink(window.location.origin, post) })}
        />
      ))}

      {!postsLoading && hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoadingMore
            ? <Loader2 className="h-5 w-5 animate-spin text-grey-3" />
            : <button type="button" onClick={onLoadMore} className="rounded-lg border border-grey-4 bg-white px-4 py-2 text-sm text-grey-2 hover:bg-grey-5">Load more</button>}
        </div>
      )}
    </div>
    {shareTarget && (
      <PostShareModal
        link={shareTarget.link}
        onShared={() => onShared(shareTarget.postId)}
        onClose={() => setShareTarget(null)}
      />
    )}
    </>
  );
}
