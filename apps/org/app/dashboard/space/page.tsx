"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createCombinedFeedLoader } from "@/lib/combined-feed";
import { loadFeedThroughPost } from "@/lib/post-sharing";
import { PanelLeftOpen, X, Loader2, Lock, Activity, Ruler, Dumbbell, Route, Flame, type IconComponent } from "@wellstaq/ui/icons";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ModalLayer } from "@/components/ui/modal-layer";
import { api } from "@/services/api";
import { ApiError } from "@/services/http";
import { useDashboardData } from "@/components/providers/dashboard-data-provider";
import { useDashboardScope } from "@/lib/scope";
import { hasPermission } from "@/lib/permissions";
import { getUserErrorMessage } from "@/lib/errors";
import { findUploadRejection, looksLikeVideo, mediaKindOf, MAX_POST_ATTACHMENTS, type PostAttachment } from "@/lib/media";
import {
  publishPostInBackground, POST_PUBLISHED_EVENT, POST_FAILED_EVENT, type PostDraft,
} from "@/lib/post-queue";
import type {
  Club, ClubCategory, Post, Comment, Story,
  OrganizationMemberInfo, ClubMemberInfo, MessageResponse,
} from "@/types/api";
import { StoriesSection } from "@/components/space/story-section";
import { PostsSection } from "@/components/space/post-section";
import { ClubSidebar, ClubChatView, CreateClubModal, JoinClubModal } from "@/components/space/club-section";
import { TrendingSection } from "@/components/space/trending-section";
import { ActivitySection } from "@/components/space/activity-section";

const METRIC_TYPES = ["steps", "distance", "squat", "run", "7min_workout"] as const;
const METRIC_BADGE: Record<string, { icon: IconComponent; label: string }> = {
  steps: { icon: Activity, label: "Steps Leader" },
  distance: { icon: Ruler, label: "Distance Leader" },
  squat: { icon: Dumbbell, label: "Squat Leader" },
  run: { icon: Route, label: "Running Leader" },
  "7min_workout": { icon: Flame, label: "7-Min Workout" },
};
interface Badge { icon: IconComponent; label: string; rank: number; }

function RestrictedResource({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-grey-4 bg-white p-6 text-center">
      <Lock className="h-6 w-6 text-grey-3" />
      <p className="text-sm text-grey-3">You don&apos;t have permission to view {label}.</p>
    </div>
  );
}

export default function SpacePage() {
  const { user, currentUser, organizationId, branches, isLoading: dashboardLoading } = useDashboardData();
  const { scope } = useDashboardScope();
  const spaceUser = useMemo(() => ({
    ...user,
    id: currentUser?.userId ?? "",
    avatarUrl: currentUser?.avatarUrl,
  }), [user, currentUser?.userId, currentUser?.avatarUrl]);

  const [activeTab, setActiveTab] = useState<"Other Clubs" | "My Clubs">("Other Clubs");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [isLeftColumnOpen, setIsLeftColumnOpen] = useState(true);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState<{ postId: string; commentId: string } | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"explore" | "feed" | "clubs">("feed");

  const [feedView, setFeedView] = useState<"branch" | "org" | "all">("all");
  const effectiveFeedScope = feedView === "org" ? "org_only" : scope.type === "overview" || feedView === "all" ? "all" : "branch_and_org";

  // ── Activity stat deltas (optimistic local bumps — see ActivitySection) ──
  const [postDelta, setPostDelta] = useState(0);
  const [likeDelta, setLikeDelta] = useState(0);
  const [restrictedResources, setRestrictedResources] = useState<Set<"clubs" | "posts" | "stories">>(new Set());
  const setResourceForbidden = useCallback((resource: "clubs" | "posts" | "stories", error?: unknown) => {
    setRestrictedResources((current) => {
      const next = new Set(current);
      if (error instanceof ApiError && error.status === 403) next.add(resource);
      else next.delete(resource);
      return next;
    });
  }, []);

  // ── Hashtag modal (fed by TrendingSection AND inline hashtags in posts) ──
  const [hashtagModalTag, setHashtagModalTag] = useState<string | null>(null);
  const [hashtagPosts, setHashtagPosts] = useState<Post[]>([]);
  const [hashtagPostsLoading, setHashtagPostsLoading] = useState(false);

  const handleSelectHashtag = useCallback(async (tag: string) => {
    if (!organizationId) return;
    setHashtagModalTag(tag);
    setHashtagPosts([]);
    setHashtagPostsLoading(true);
    try {
      const res = await api.hashtag.getPostsByTag(organizationId, tag);
      setHashtagPosts(res.items);
    } catch {
      setHashtagPosts([]);
    } finally {
      setHashtagPostsLoading(false);
    }
  }, [organizationId]);

  // ── Org members map ──────────────────────────────────────────────────
  const [memberMap, setMemberMap] = useState<Map<string, OrganizationMemberInfo>>(new Map());
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    api.organization.getMembers(organizationId).then((res) => {
      if (cancelled) return;
      setMemberMap(new Map(res.items.map((m) => [m.id, m])));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [organizationId]);
  const getMember = useCallback((userId: string) => memberMap.get(userId), [memberMap]);

  // ── Leaderboard badges ────────────────────────────────────────────────
  const [badgeMap, setBadgeMap] = useState<Map<string, Badge>>(new Map());
  useEffect(() => {
    if (!organizationId) return;
    const isOrgWide = scope.type === "overview" || feedView === "org";
    let cancelled = false;
    async function loadBadges() {
      const next = new Map<string, Badge>();
      await Promise.all(METRIC_TYPES.map(async (metric) => {
        try {
          const res = isOrgWide
            ? await api.leaderboard.getOrg(organizationId!, metric)
            : await api.leaderboard.getBranch(organizationId!, metric);
          res.items.forEach((entry) => {
            const rank = isOrgWide ? entry.orgRank : entry.rank;
            if (rank <= 3 && !next.has(entry.userId)) next.set(entry.userId, { ...METRIC_BADGE[metric], rank });
          });
        } catch {}
      }));
      if (!cancelled) setBadgeMap(next);
    }
    void loadBadges();
    return () => { cancelled = true; };
  }, [organizationId, scope.type, feedView]);

  // ── Clubs ──────────────────────────────────────────────────────────────
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubToJoin, setClubToJoin] = useState<string | null>(null);

  // FIX: club membership ("am I a member of this club?") is personal user
  // data — it must not be re-derived from whichever scoped list happens to
  // come back from the branch vs org-wide endpoint. Previously `allClubs`
  // (and therefore `isMember`) was fully replaced on every scope switch,
  // so a club you'd already joined could come back with `isMember: false`
  // from a differently-scoped call, causing the "+" join button to
  // reappear and membership to not persist across Overview/branch toggles.
  //
  // `joinedClubIds` is the standalone, scope-independent source of truth.
  // It's seeded from whatever the club list has told us so far and is
  // updated optimistically on join — it is never reset by a scope change.
  const joinedClubIdsRef = useRef<Set<string>>(new Set());

  // Membership belongs to the signed-in user, so do not carry it into a
  // different organization if the provider account changes in-place.
  useEffect(() => {
    joinedClubIdsRef.current.clear();
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    // On Overview, wait until bootstrap has supplied the complete branch list.
    // The org-wide discovery endpoint currently returns the right clubs but not
    // reliable per-user `isMember` flags; branch-scoped responses do return them.
    if (scope.type === "overview" && dashboardLoading) return;
    let cancelled = false;
    async function loadClubs(orgId: string) {
      setClubsLoading(true);
      try {
        const response = scope.type === "overview"
          ? await api.club.getClubs(orgId, { limit: 200 })
          : await api.club.getClubs(orgId, { branchId: scope.branchId, limit: 200 });

        // Seed personal membership on a fresh Overview load from every
        // branch-scoped club response. This removes the old dependency on the
        // user visiting a branch first before "My Clubs" becomes accurate.
        if (scope.type === "overview" && branches.length > 0) {
          const branchResponses = await Promise.allSettled(
            branches.map((branch) => api.club.getClubs(orgId, { branchId: branch.id, limit: 200 })),
          );
          if (cancelled) return;
          branchResponses.forEach((result) => {
            if (result.status !== "fulfilled") return;
            result.value.items.forEach((club) => {
              if (club.isMember) joinedClubIdsRef.current.add(club.id);
            });
          });
        }
        if (!cancelled) {
          // Merge: a club is "mine" if either this response says so, or we
          // already knew it was from a previous fetch in another scope.
          const merged = response.items.map((c) => {
            const isMember = c.isMember || joinedClubIdsRef.current.has(c.id);
            return { ...c, isMember };
          });
          merged.forEach((c) => {
            if (c.isMember) joinedClubIdsRef.current.add(c.id);
          });
          setAllClubs(merged);
          setResourceForbidden("clubs");
        }
      } catch (error) {
        if (!cancelled) {
          setAllClubs([]);
          setResourceForbidden("clubs", error);
        }
      } finally {
        if (!cancelled) setClubsLoading(false);
      }
    }
    void loadClubs(organizationId);
    return () => { cancelled = true; };
  }, [organizationId, scope, branches, dashboardLoading, setResourceForbidden]);

  useEffect(() => { setSelectedClub(null); }, [scope]);

  const filteredClubs = allClubs.filter((c) => !c.isMember);
  const filteredMyClubs = allClubs.filter((c) => c.isMember);

  const handleJoinClub = async (id: string) => {
    if (!organizationId) return;
    const club = allClubs.find((c) => c.id === id);
    if (club) {
      try {
        if (!currentUser?.userId) return;
        await api.club.joinClub(organizationId, id, currentUser.userId);
        joinedClubIdsRef.current.add(id); // persist personal membership immediately
        setAllClubs((prev) => prev.map((c) => (c.id === id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c)));
        toast.success(`Successfully joined ${club.name}!`);
      } catch {
        toast.error("We couldn't join the club. Try again.");
      }
    }
    setClubToJoin(null);
  };

  // ── Club creation ─────────────────────────────────────────────────────
  const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);
  const [newClubData, setNewClubData] = useState<{ name: string; description: string; imageUrl: string; category: ClubCategory }>(
    { name: "", description: "", imageUrl: "", category: "fitness" },
  );
  const [clubImagePreview, setClubImagePreview] = useState<string | null>(null);
  const [isUploadingClubImage, setIsUploadingClubImage] = useState(false);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [clubCreateError, setClubCreateError] = useState<string | null>(null);
  const clubRequestPending = useRef(false);
  const canCreateClub = !clubsLoading && !dashboardLoading && !!organizationId && scope.type === "branch" &&
    hasPermission(currentUser?.permissions ?? [], "club.create", scope.branchId);

  useEffect(() => {
    return () => { if (clubImagePreview) URL.revokeObjectURL(clubImagePreview); };
  }, [clubImagePreview]);

  const handleClubImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || clubRequestPending.current) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setClubCreateError("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setClubCreateError("Choose an image smaller than 5 MB.");
      return;
    }
    clubRequestPending.current = true;
    setClubCreateError(null);
    setClubImagePreview(URL.createObjectURL(file));
    setNewClubData((prev) => ({ ...prev, imageUrl: "" }));
    setIsUploadingClubImage(true);
    try {
      const { uploadUrl, mediaUrl } = await api.storage.requestUploadUrl({ domain: "clubs", contentType: file.type });
      const putResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putResponse.ok) throw new Error(`Upload failed with ${putResponse.status}`);
      setNewClubData((prev) => ({ ...prev, imageUrl: mediaUrl }));
    } catch {
      setClubCreateError("Image upload failed. Try again or continue without an image.");
      setClubImagePreview(null);
      setNewClubData((prev) => ({ ...prev, imageUrl: "" }));
    } finally {
      clubRequestPending.current = false;
      setIsUploadingClubImage(false);
    }
  };

  const handleRemoveClubImage = () => {
    if (clubRequestPending.current) return;
    setClubCreateError(null);
    setClubImagePreview(null);
    setNewClubData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clubRequestPending.current) return;
    if (!organizationId) {
      setClubCreateError("Your account is still loading. Try again shortly.");
      return;
    }
    if (scope.type !== "branch") {
      setClubCreateError("Switch to a branch to create a club.");
      return;
    }
    if (!canCreateClub) {
      setClubCreateError("You don't have permission to create clubs in this branch.");
      return;
    }
    const name = newClubData.name.trim();
    const description = newClubData.description.trim();
    if (!name || !description) {
      setClubCreateError("Enter a club name and description.");
      return;
    }
    clubRequestPending.current = true;
    setIsCreatingClub(true);
    setClubCreateError(null);
    try {
      const created = await api.club.createClub(organizationId, scope.branchId, {
        name,
        description,
        imageUrl: newClubData.imageUrl || undefined,
        privacy: "public",
        category: newClubData.category,
      });
      joinedClubIdsRef.current.add(created.id); // creator is automatically a member
      setAllClubs((prev) => [{ ...created, isMember: true }, ...prev.filter((club) => club.id !== created.id)]);
      setActiveTab("My Clubs");
      setIsCreateClubModalOpen(false);
      setNewClubData({ name: "", description: "", imageUrl: "", category: "fitness" });
      setClubImagePreview(null);
      toast.success(`${created.name} created.`);
    } catch (error) {
      setClubCreateError(error instanceof ApiError && error.status === 409
        ? "A club with this name already exists. Choose another name."
        : error instanceof ApiError && error.status === 422
          ? "Check the club details and try again."
          : getUserErrorMessage(error, "We couldn't create the club. Try again."));
    } finally {
      clubRequestPending.current = false;
      setIsCreatingClub(false);
    }
  };

  // ── Posts ──────────────────────────────────────────────────────────────
  const searchParams = useSearchParams();
  const sharedPostId = searchParams.get("postId");
  const sharedStoryId = searchParams.get("storyId");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsTotal, setPostsTotal] = useState(0);
  const nextPostsOffset = useRef(0);
  const feedGeneration = useRef(0);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [postLocation, setPostLocation] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  // The audience is chosen explicitly and defaults to Everyone. It is deliberately
  // independent of the feed being viewed: posting to Everyone from a branch feed,
  // or to a branch from Overview, both have to be possible.
  const [audienceBranchId, setAudienceBranchId] = useState<string | null>(null);
  const audienceName = branches.find((branch) => branch.id === audienceBranchId)?.name ?? "Everyone";
  // One promise per attachment, so pressing Post can hand the still-running
  // uploads to the background publisher instead of waiting on them.
  const uploadPromises = useRef(new Map<string, Promise<string>>());

  const fetchPostsPage = useMemo(() => {
    if (!organizationId) return async () => ({ items: [], total: 0, offset: 0, limit: 20 });
    const orgId = organizationId;
    if (effectiveFeedScope === "all") {
      return createCombinedFeedLoader([
        (offset) => api.post.getPosts(orgId, { scope: "org_only", offset }),
        ...branches.map((branch) => async (offset: number) => {
          try {
            return await api.post.getPosts(orgId, { scope: "branch_and_org", branchId: branch.id, offset });
          } catch (error) {
            // The server remains the authority for access to each branch.
            if (error instanceof ApiError && error.status === 403) return { items: [], total: 0, offset, limit: 20 };
            throw error;
          }
        }),
      ]);
    }
    return (offset: number) => api.post.getPosts(orgId, {
      scope: effectiveFeedScope,
      branchId: effectiveFeedScope === "branch_and_org" && scope.type === "branch" ? scope.branchId : undefined,
      offset,
    });
  }, [organizationId, effectiveFeedScope, branches, scope]);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    ++feedGeneration.current;
    nextPostsOffset.current = 0;
    async function loadPosts() {
      setPostsLoading(true);
      setIsLoadingMorePosts(false);
      try {
        // `loadFeedThroughPost` returns items only, so the page total is picked up
        // from the last response it read — that is what tells paging when to stop.
        let total = 0;
        const items = await loadFeedThroughPost(
          async (offset) => {
            const response = await fetchPostsPage(offset);
            total = response.total;
            return response;
          },
          sharedPostId,
          () => cancelled,
        );
        if (!cancelled) {
          nextPostsOffset.current = items.length;
          setPosts(items);
          setPostsTotal(total);
          setResourceForbidden("posts");
        }
      } catch (error) {
        if (!cancelled) {
          setPosts([]);
          setPostsTotal(0);
          setResourceForbidden("posts", error);
        }
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    }
    void loadPosts();
    return () => { cancelled = true; };
  }, [organizationId, fetchPostsPage, setResourceForbidden, sharedPostId]);

  const handleLoadMorePosts = useCallback(async () => {
    if (!organizationId || isLoadingMorePosts || postsLoading) return;
    const generation = feedGeneration.current;
    const offset = nextPostsOffset.current;
    if (offset >= postsTotal) return;
    setIsLoadingMorePosts(true);
    try {
      const response = await fetchPostsPage(offset);
      if (generation !== feedGeneration.current) return;
      nextPostsOffset.current = response.offset + response.items.length;
      setPosts((prev) => {
        const seen = new Set(prev.map((post) => post.id));
        return [...prev, ...response.items.filter((post) => !seen.has(post.id))];
      });
      setPostsTotal(response.total);
    } catch {
      toast.error("We couldn't load more posts. Try again.");
    } finally {
      if (generation === feedGeneration.current) setIsLoadingMorePosts(false);
    }
  }, [organizationId, isLoadingMorePosts, postsLoading, postsTotal, fetchPostsPage]);

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;

    const room = MAX_POST_ATTACHMENTS - attachments.length;
    if (files.length > room) {
      toast.error(`You can attach up to ${MAX_POST_ATTACHMENTS} files. There is room for ${room} more.`);
      return;
    }
    // Every file in the batch is checked before any upload starts, so an
    // unsupported or oversized file is refused at the picker — by name — rather
    // than failing halfway through the batch.
    const rejection = findUploadRejection(files);
    if (rejection) {
      toast.error(rejection.reason);
      return;
    }

    const pending: PostAttachment[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      kind: mediaKindOf(file) ?? "image",
      previewUrl: URL.createObjectURL(file),
      mediaUrl: null,
    }));
    setAttachments((prev) => [...prev, ...pending]);

    pending.forEach((attachment, index) => {
      const file = files[index];
      const upload = (async () => {
        try {
          const { uploadUrl, mediaUrl } = await api.storage.requestUploadUrl({ domain: "posts", contentType: file.type });
          const putResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
          if (!putResponse.ok) throw new Error(`Upload failed with ${putResponse.status}`);
          setAttachments((prev) => prev.map((item) => (item.id === attachment.id ? { ...item, mediaUrl } : item)));
          return mediaUrl;
        } catch (err) {
          // The PUT goes to object storage rather than the API, so it never reaches
          // the shared API error channel — say so here or it fails silently.
          console.error("Post media upload error:", err);
          const message = `“${file.name}” didn't upload. Check your connection and add it again.`;
          toast.error(message);
          URL.revokeObjectURL(attachment.previewUrl);
          setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
          uploadPromises.current.delete(attachment.id);
          throw new Error(message);
        }
      })();
      uploadPromises.current.set(attachment.id, upload);
      // Observed here so a failure before Post is pressed does not surface as an
      // unhandled rejection; the post that needs it still sees the rejection.
      upload.catch(() => {});
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    uploadPromises.current.delete(attachmentId);
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === attachmentId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== attachmentId);
    });
  };

  // Publishing runs outside this component, so its outcome arrives as an event.
  useEffect(() => {
    const onPublished = (event: Event) => {
      const created = (event as CustomEvent<Post>).detail;
      setPostDelta((d) => d + 1);
      // A post only joins the list in front of you when this feed would show it —
      // an org-wide post does belong in a branch feed, which also reads org posts.
      const belongsInCurrentFeed = effectiveFeedScope === "all" || (effectiveFeedScope === "org_only"
        ? !created.branchId
        : !created.branchId || (scope.type === "branch" && created.branchId === scope.branchId));
      if (!belongsInCurrentFeed) return;
      setPosts((prev) => (prev.some((post) => post.id === created.id) ? prev : [created, ...prev]));
      setPostsTotal((total) => total + 1);
    };
    const onFailed = (event: Event) => {
      // Restore the wording and successfully uploaded attachments for retry.
      const draft = (event as CustomEvent<PostDraft>).detail;
      setPostContent((current) => current || draft.content);
      setPostLocation((current) => current ?? draft.location);
      if (draft.mediaUrls?.length) {
        setAttachments((current) => [...current, ...(draft.mediaUrls ?? []).map((mediaUrl) => ({
          id: crypto.randomUUID(), name: "Uploaded attachment",
          kind: looksLikeVideo(mediaUrl, draft.mediaType) ? "video" as const : "image" as const,
          previewUrl: mediaUrl, mediaUrl,
        }))].slice(0, MAX_POST_ATTACHMENTS));
      }
      setAudienceBranchId(draft.branchId);
    };
    window.addEventListener(POST_PUBLISHED_EVENT, onPublished);
    window.addEventListener(POST_FAILED_EVENT, onFailed);
    return () => {
      window.removeEventListener(POST_PUBLISHED_EVENT, onPublished);
      window.removeEventListener(POST_FAILED_EVENT, onFailed);
    };
  }, [effectiveFeedScope, scope]);

  const handleCreatePost = () => {
    if (!organizationId) return;
    if (!postContent.trim() && attachments.length === 0 && !postLocation) return;

    const queued = attachments.slice();
    const uploads = queued.map((item) => (
      uploadPromises.current.get(item.id)
        ?? (item.mediaUrl
          ? Promise.resolve(item.mediaUrl)
          : Promise.reject(new Error(`“${item.name}” didn't upload. Add it again and repost.`)))
    ));

    void publishPostInBackground({
      organizationId,
      branchId: audienceBranchId,
      audienceName,
      content: postContent,
      location: postLocation,
      // Typed from the file itself. `media_url` carries the first attachment, so
      // the single `media_type` describes that one.
      mediaType: queued[0]?.kind,
      uploads,
    });

    // Cleared immediately: publishing continues in the background, so the
    // composer is free for the next thing rather than held open by an upload.
    setPostContent("");
    setPostLocation(null);
    setAttachments([]);
    uploadPromises.current.clear();
    queued.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  };

  const handleShared = async (postId: string) => {
    if (!organizationId) return;
    try {
      await api.post.sharePost(organizationId, postId);
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, shareCount: post.shareCount + 1 } : post)));
    } catch {
      toast.error("Your link is ready, but we couldn't record the share.");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!organizationId) return;
    try {
      await api.post.deletePost(organizationId, id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post deleted successfully");
    } catch {
      toast.error("We couldn't delete the post. Try again.");
    } finally {
      setDeleteConfirmPostId(null);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!organizationId) return;
    const isLiked = likedPostIds.has(postId);
    try {
      const result = isLiked
        ? await api.post.unlikePost(organizationId, postId)
        : await api.post.likePost(organizationId, postId);
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(postId); else next.delete(postId);
        return next;
      });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likeCount: result.likeCount } : p)));
      if (!isLiked && result.liked) setLikeDelta((d) => d + 1);
    } catch {
      toast.error("We couldn't update your reaction. Try again.");
    }
  };

  const handleToggleComments = async (postId: string) => {
    setExpandedComments((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
    if (!commentsByPost[postId] && organizationId) {
      try {
        const response = await api.post.getComments(organizationId, postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: response.items }));
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: [] }));
      }
    }
  };

  /** `parentCommentId` must always be a top-level comment id — the reply UI
   *  resolves a reply's parent before calling this, because the API only
   *  supports one level of nesting. */
  const handleAddComment = async (postId: string, content: string, parentCommentId?: string) => {
    if (!content.trim() || !organizationId) return;
    try {
      const comment = await api.post.addComment(organizationId, postId, content, parentCommentId);
      setCommentsByPost((prev) => {
        const existing = prev[postId] ?? [];
        if (!parentCommentId) return { ...prev, [postId]: [...existing, comment] };
        return {
          ...prev,
          [postId]: existing.map((c) => (c.id === parentCommentId
            ? { ...c, replies: [...(c.replies ?? []), comment] }
            : c)),
        };
      });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)));
      if (!expandedComments.includes(postId)) setExpandedComments((prev) => [...prev, postId]);
      toast.success(parentCommentId ? "Reply added!" : "Comment added!");
    } catch {
      toast.error(parentCommentId ? "We couldn't add the reply. Try again." : "We couldn't add the comment. Try again.");
    }
  };

  const handleEditComment = async (postId: string, commentId: string, content: string) => {
    if (!content.trim() || !organizationId) return;
    try {
      const updated = await api.post.editComment(organizationId, postId, commentId, content);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map((c) => (c.id === commentId
          ? { ...c, content: updated.content, updatedAt: updated.updatedAt }
          : {
            ...c,
            replies: c.replies?.map((r) => (r.id === commentId
              ? { ...r, content: updated.content, updatedAt: updated.updatedAt }
              : r)),
          })),
      }));
      toast.success("Comment updated!");
    } catch {
      toast.error("We couldn't update the comment. Try again.");
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!organizationId) return;
    try {
      await api.post.deleteComment(organizationId, postId, commentId);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? [])
          .filter((c) => c.id !== commentId)
          .map((c) => (c.replies?.some((r) => r.id === commentId)
            ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
            : c)),
      }));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p)));
      toast.success("Comment deleted!");
    } catch {
      toast.error("We couldn't delete the comment. Try again.");
    } finally {
      setDeleteConfirmComment(null);
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setPostLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`),
        () => setPostLocation("Lagos, Nigeria"),
      );
    } else {
      setPostLocation("Lagos, Nigeria");
    }
  };

  // ── Stories ────────────────────────────────────────────────────────────
  const [stories, setStories] = useState<Story[]>([]);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [deleteConfirmStoryId, setDeleteConfirmStoryId] = useState<string | null>(null);
  // There is no endpoint reporting whether you already liked a story, so this
  // only ever holds stories toggled in this session; everything else starts
  // unfilled from the story's own `likeCount`.
  const [storyLikes, setStoryLikes] = useState<Record<string, { liked: boolean; likeCount: number }>>({});

  const handleToggleStoryLike = async (storyId: string, liked: boolean) => {
    if (!organizationId) return;
    try {
      const result = liked
        ? await api.story.unlikeStory(organizationId, storyId)
        : await api.story.likeStory(organizationId, storyId);
      setStoryLikes((prev) => ({ ...prev, [storyId]: { liked: result.liked, likeCount: result.likeCount } }));
    } catch {
      toast.error("We couldn't update your reaction. Try again.");
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!organizationId) return;
    try {
      await api.story.deleteStory(organizationId, storyId);
      setStories((prev) => prev.filter((story) => story.id !== storyId));
      toast.success("Story deleted.");
    } catch {
      toast.error("We couldn't delete the story. Try again.");
    } finally {
      setDeleteConfirmStoryId(null);
    }
  };

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    async function loadStories(orgId: string) {
      try {
        const response = effectiveFeedScope === "org_only"
          ? await api.story.getStories(orgId, { scope: "org_only" })
          : await api.story.getStories(orgId, { branchId: scope.type === "branch" ? scope.branchId : undefined, scope: "branch_and_org" });
        if (!cancelled) {
          setStories(response.items);
          setResourceForbidden("stories");
        }
      } catch (error) {
        if (!cancelled) {
          setStories([]);
          setResourceForbidden("stories", error);
        }
      }
    }
    void loadStories(organizationId);
    return () => { cancelled = true; };
  }, [organizationId, scope, effectiveFeedScope, setResourceForbidden]);

  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error("Could not read video metadata"));
      video.src = URL.createObjectURL(file);
    });
  }

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizationId) return;

    const rejection = findUploadRejection([file]);
    if (rejection) {
      toast.error(rejection.reason);
      e.target.value = "";
      return;
    }

    if (file.type.startsWith("video/")) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > 60) {
          toast.error("Videos for stories must be 1 minute or shorter.");
          e.target.value = "";
          return;
        }
      } catch {
        toast.error("Couldn't read that video file. Try a different one.");
        e.target.value = "";
        return;
      }
    }

    setIsUploadingStory(true);
    try {
      const { uploadUrl, mediaUrl } = await api.storage.requestUploadUrl({ domain: "stories", contentType: file.type });
      const putResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putResponse.ok) throw new Error(`Upload failed with ${putResponse.status}`);

      const created = await api.story.createStory(organizationId, {
        branchId: audienceBranchId,
        mediaUrl,
        mediaType: file.type.startsWith("video/") ? "video" : "image",
      });
      setStories((prev) => [created, ...prev]);
      toast.success(`Story posted to ${audienceName}.`);
    } catch (err) {
      console.error("Story upload error:", err);
      toast.error("We couldn't publish the story. Try again.");
    } finally {
      setIsUploadingStory(false);
      e.target.value = "";
    }
  };

  // ── Club chat ──────────────────────────────────────────────────────────
  const [chatMessagesList, setChatMessagesList] = useState<MessageResponse[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [clubMemberMap, setClubMemberMap] = useState<Map<string, ClubMemberInfo>>(new Map());

  const activeClubData = allClubs.find((c) => c.id === selectedClub);
  const canModerateChat = useMemo(() => {
    if (!currentUser || !activeClubData) return false;
    if (activeClubData.leaderId === currentUser?.userId) return true;
    return currentUser.permissions.some(
      (p: { name: string; branchId: string | null }) =>
        p.name === "chat.moderate" && (p.branchId === null || p.branchId === activeClubData.branchId),
    );
  }, [currentUser, activeClubData]);

  useEffect(() => {
    if (!selectedClub || !organizationId || !activeClubData?.isMember) return;
    let cancelled = false;
    async function loadClubChat(clubId: string, orgId: string) {
      setChatLoading(true);
      try {
        const [membersRes, messagesRes] = await Promise.all([
          api.club.getClubMembers(orgId, clubId),
          api.chat.getMessages(orgId, "club", clubId),
        ]);
        if (cancelled) return;
        setClubMemberMap(new Map(membersRes.items.map((m) => [m.id, m])));
        setChatMessagesList(messagesRes.items.slice().reverse());
      } catch {
        if (!cancelled) setChatMessagesList([]);
      } finally {
        if (!cancelled) setChatLoading(false);
      }
    }
    void loadClubChat(selectedClub, organizationId);
    return () => { cancelled = true; };
  }, [selectedClub, organizationId, activeClubData?.isMember]);

  const getChatUser = useCallback(
    (userId: string) => clubMemberMap.get(userId) ?? getMember(userId),
    [clubMemberMap, getMember],
  );

  const handleSendMessage = async (mediaUrl?: string, mediaType?: string) => {
    if (!chatInput.trim() && !mediaUrl) return;
    if (!organizationId || !selectedClub) return;
    try {
      const created = await api.chat.sendMessage(organizationId, "club", selectedClub, {
        content: chatInput.trim() || undefined,
        mediaUrl,
        mediaType,
      });
      // Sending a message must not create a pin. Pinning is an explicit moderator action.
      setChatMessagesList((prev) => [...prev, { ...created, isPinned: false }]);
      setChatInput("");
    } catch {
      toast.error("We couldn't send the message. Check your club access and try again.");
    }
  };

  const handleSendAttachment = async (file: File) => {
    if (!organizationId) return;
    const isVideo = file.type.startsWith("video/");
    try {
      const { uploadUrl, mediaUrl } = await api.storage.requestUploadUrl({ domain: "chat", contentType: file.type });
      const putResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putResponse.ok) throw new Error(`Upload failed with ${putResponse.status}`);
      await handleSendMessage(mediaUrl, isVideo ? "video" : "image");
      toast.success("Attachment sent!");
    } catch {
      toast.error("We couldn't send the attachment. Try again.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!organizationId) return;
    try {
      await api.chat.deleteMessage(organizationId, messageId);
      setChatMessagesList((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message deleted");
    } catch {
      toast.error("We couldn't delete the message. Try again.");
    }
  };

  const handleTogglePin = async (message: MessageResponse) => {
    if (!organizationId) return;
    try {
      if (message.isPinned) {
        await api.chat.unpinMessage(organizationId, message.id);
        setChatMessagesList((prev) => prev.map((m) => (m.id === message.id ? { ...m, isPinned: false } : m)));
      } else {
        await api.chat.pinMessage(organizationId, message.id);
        setChatMessagesList((prev) => prev.map((m) => ({ ...m, isPinned: m.id === message.id })));
      }
    } catch {
      toast.error("We couldn't update the pin. Try again.");
    }
  };

  return (
    <>
      <div className="relative flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-white lg:flex-row">
        <div className="flex shrink-0 border-b border-grey-4 bg-white lg:hidden">
          <button onClick={() => setActiveMobileTab("explore")} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeMobileTab === "explore" ? "border-primary-1 text-primary-1" : "border-transparent text-grey-2"}`}>Explore</button>
          <button onClick={() => setActiveMobileTab("feed")} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeMobileTab === "feed" ? "border-primary-1 text-primary-1" : "border-transparent text-grey-2"}`}>Feed</button>
          <button onClick={() => setActiveMobileTab("clubs")} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeMobileTab === "clubs" ? "border-primary-1 text-primary-1" : "border-transparent text-grey-2"}`}>Clubs</button>
        </div>

        <div className={`min-h-0 flex-1 w-full lg:w-[320px] lg:flex-none shrink-0 border-r border-grey-4 bg-white overflow-y-auto ${!isLeftColumnOpen ? "hidden" : activeMobileTab === "clubs" ? "block" : "hidden lg:block"}`}>
          {restrictedResources.has("clubs") ? <RestrictedResource label="clubs" /> : <ClubSidebar
            isOpen={isLeftColumnOpen}
            onClose={() => setIsLeftColumnOpen(false)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            clubsLoading={clubsLoading}
            filteredClubs={filteredClubs}
            filteredMyClubs={filteredMyClubs}
            onSelectClub={setSelectedClub}
            onRequestJoin={setClubToJoin}
            canCreate={canCreateClub}
            createUnavailableReason={scope.type === "overview" ? "Switch to a branch to create a club." : clubsLoading || dashboardLoading ? "Loading your clubs..." : "You don't have permission to create clubs in this branch."}
            onOpenCreate={() => { setClubCreateError(null); setIsCreateClubModalOpen(true); }}
          />}
        </div>

        <div className={`flex-1 min-h-0 min-w-0 self-stretch bg-[#FAFAFA] overflow-hidden ${activeMobileTab === "feed" ? "block" : "hidden lg:block"}`}>
          {selectedClub ? (
            <ClubChatView
              club={activeClubData}
              user={spaceUser}
              chatLoading={chatLoading}
              chatMessages={chatMessagesList}
              getChatUser={getChatUser}
              canModerateChat={canModerateChat}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendMessage={handleSendMessage}
              onSendAttachment={handleSendAttachment}
              onDeleteMessage={handleDeleteMessage}
              onTogglePin={handleTogglePin}
              onBack={() => setSelectedClub(null)}
              onJoin={() => selectedClub && handleJoinClub(selectedClub)}
            />
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFAFA]">
              <div className="px-4 pt-4 pb-2 bg-white border-b border-grey-4 flex flex-wrap items-center gap-3">
                {!isLeftColumnOpen && (
                  <button onClick={() => setIsLeftColumnOpen(true)} className="text-grey-2 hover:text-grey-1 p-1 border border-grey-4 rounded-md bg-white flex-shrink-0">
                    <PanelLeftOpen size={14} strokeWidth={1.5} />
                  </button>
                )}
                <h2 className="page-title">Feed</h2>
                <div className="ml-auto flex items-center gap-2">
                  {(
                    <div data-tour="feed-views" className="flex bg-grey-5 rounded-lg p-0.5">
                      <SelectablePill onClick={() => setFeedView("all")} selected={feedView === "all"} appearance="plain" className="px-3">All posts</SelectablePill>
                      {scope.type === "branch" && <SelectablePill onClick={() => setFeedView("branch")} selected={feedView === "branch"} appearance="plain" className="px-3">My Branch</SelectablePill>}
                      <SelectablePill onClick={() => setFeedView("org")} selected={feedView === "org"} appearance="plain" className="px-3">General</SelectablePill>
                    </div>
                  )}
                  {/* Who a new story goes to. Shares the composer's audience, so the
                      two can never disagree about where something was published.
                      Borderless, and sized to its label rather than to the widest
                      branch name, so the chevron sits right beside the text. */}
                  <FilterDropdown
                    ariaLabel="Story audience"
                    align="right"
                    value={audienceBranchId ?? ""}
                    options={[{ label: "Everyone", value: "" }, ...branches.map((branch) => ({ label: branch.name, value: branch.id }))]}
                    onValueChange={(value) => setAudienceBranchId(value || null)}
                    className="max-w-[180px]"
                    buttonClassName="h-8 gap-1.5 border-0 bg-transparent px-2 text-xs font-normal"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-3">
                <div className="w-full mb-6">
                  {restrictedResources.has("stories") ? <RestrictedResource label="stories" /> : <StoriesSection
                    stories={stories}
                    getMember={getMember}
                    currentUser={currentUser}
                    isUploading={isUploadingStory}
                    onUploadStory={handleCreateStory}
                    openStoryId={sharedStoryId}
                    storyLikes={storyLikes}
                    onToggleLike={handleToggleStoryLike}
                    onDeleteStory={setDeleteConfirmStoryId}
                  />}
                </div>
                {<PostsSection
                  feedNotice={restrictedResources.has("posts") ? <RestrictedResource label="posts" /> : undefined}
                  user={spaceUser}
                  posts={posts}
                  postsLoading={postsLoading}
                  sharedPostId={sharedPostId}
                  getMember={getMember}
                  badgeMap={badgeMap}
                  likedPostIds={likedPostIds}
                  commentsByPost={commentsByPost}
                  expandedComments={expandedComments}
                  postContent={postContent}
                  onContentChange={setPostContent}
                  attachments={attachments}
                  onMediaSelect={handleMediaSelect}
                  onRemoveAttachment={handleRemoveAttachment}
                  postLocation={postLocation}
                  onShareLocation={handleShareLocation}
                  onClearLocation={() => setPostLocation(null)}
                  audienceBranchId={audienceBranchId}
                  branches={branches}
                  onAudienceChange={setAudienceBranchId}
                  onSubmitPost={handleCreatePost}
                  placeholder={effectiveFeedScope === "org_only" ? "Share something in General..." : "Share a workout, milestone, or wellness tip..."}
                  onToggleLike={handleToggleLike}
                  onToggleComments={handleToggleComments}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onRequestDeletePost={setDeleteConfirmPostId}
                  onRequestDeleteComment={(postId, commentId) => setDeleteConfirmComment({ postId, commentId })}
                  onHashtagClick={handleSelectHashtag}
                  onShared={handleShared}
                  hasMore={posts.length < postsTotal}
                  isLoadingMore={isLoadingMorePosts}
                  onLoadMore={handleLoadMorePosts}
                />}
              </div>
            </div>
          )}
        </div>

       <div className={`min-h-0 flex-1 w-full lg:w-[320px] lg:flex-none shrink-0 border-l border-grey-4 bg-white overflow-y-auto ${activeMobileTab === "explore" ? "block" : "hidden lg:block"}`}>
  <div className="w-full border-l border-grey-4 bg-[#ffffff] p-6 overflow-y-auto no-scrollbar h-full">
    <ActivitySection
      organizationId={organizationId ?? undefined}
      userId={currentUser?.userId}
      groupsJoined={filteredMyClubs.length}
      groupsRestricted={restrictedResources.has("clubs")}
      postDelta={postDelta}
      likeDelta={likeDelta}
    />
    <TrendingSection organizationId={organizationId ?? undefined} onSelectHashtag={handleSelectHashtag} />
  </div>
</div>
      </div>

      <CreateClubModal
        isOpen={isCreateClubModalOpen}
        onClose={() => { if (!clubRequestPending.current) setIsCreateClubModalOpen(false); }}
        formData={newClubData}
        onFormChange={(patch) => { setClubCreateError(null); setNewClubData((prev) => ({ ...prev, ...patch })); }}
        imagePreview={clubImagePreview}
        isUploadingImage={isUploadingClubImage}
        isCreating={isCreatingClub}
        error={clubCreateError}
        onImageSelect={handleClubImageSelect}
        onRemoveImage={handleRemoveClubImage}
        onSubmit={handleCreateClub}
      />

      <JoinClubModal clubId={clubToJoin} onCancel={() => setClubToJoin(null)} onConfirm={handleJoinClub} />

      <ConfirmModal isOpen={!!deleteConfirmPostId} onClose={() => setDeleteConfirmPostId(null)} onConfirm={() => deleteConfirmPostId && handleDeletePost(deleteConfirmPostId)} title="Delete Post" description="Are you sure you want to delete this post? This action cannot be undone." confirmText="Delete Post" isDestructive />
      <ConfirmModal isOpen={!!deleteConfirmComment} onClose={() => setDeleteConfirmComment(null)} onConfirm={() => deleteConfirmComment && handleDeleteComment(deleteConfirmComment.postId, deleteConfirmComment.commentId)} title="Delete Comment" description="Are you sure you want to delete this comment? This action cannot be undone." confirmText="Delete Comment" isDestructive />
      <ConfirmModal isOpen={!!deleteConfirmStoryId} onClose={() => setDeleteConfirmStoryId(null)} onConfirm={() => deleteConfirmStoryId && handleDeleteStory(deleteConfirmStoryId)} title="Delete Story" description="Are you sure you want to delete this story? This action cannot be undone." confirmText="Delete Story" isDestructive />

      <AnimatePresence>
        {hashtagModalTag && (
          <ModalLayer className="flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setHashtagModalTag(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[calc(100dvh-32px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[12px] border border-grey-4 bg-white shadow-[0px_16px_32px_-16px_rgba(0,0,0,0.24)]"
            >
              <div className="p-5 border-b border-grey-4 flex items-center justify-between bg-grey-5/30 shrink-0">
                <h3 className="text-lg font-bold text-grey-1">{hashtagModalTag}</h3>
                <button onClick={() => setHashtagModalTag(null)} className="p-2 hover:bg-grey-4 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-grey-2" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
                {hashtagPostsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-primary-1 animate-spin" />
                  </div>
                ) : hashtagPosts.length === 0 ? (
                  <p className="text-sm text-grey-3 text-center py-10">No posts found for this hashtag yet.</p>
                ) : (
                  hashtagPosts.map((post) => (
                    <div key={post.id} className="border border-grey-4 rounded-xl p-4">
                      {post.content && <p className="text-sm text-grey-1 whitespace-pre-wrap mb-3">{post.content}</p>}
                      {post.mediaType === "image" && post.mediaUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.mediaUrl} alt="" className="w-full rounded-lg mb-3 object-cover max-h-[300px]" />
                      )}
                      {post.mediaType === "video" && post.mediaUrl && (
                        <video src={post.mediaUrl} controls className="w-full rounded-lg mb-3 max-h-[300px]" />
                      )}
                      <div className="flex items-center gap-4 text-xs text-grey-3">
                        <span>{post.likeCount} likes</span>
                        <span>{post.commentCount} comments</span>
                        <span>{post.shareCount} shares</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </ModalLayer>
        )}
      </AnimatePresence>
    </>
  );
}
