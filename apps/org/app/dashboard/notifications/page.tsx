"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Calendar, Trophy, ShieldAlert, MessageSquare, Loader2 } from "@wellstaq/ui/icons";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useDashboardData } from "@/components/providers/dashboard-data-provider";
import { Avatar } from "@/components/space/story-section";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { formatRelativeTime } from "@/lib/time";
import { getUserErrorMessage } from "@/lib/errors";
import {
  notificationCategory,
  notificationHref,
  isActorDriven,
  stripActorName,
  groupByDay,
  type NotificationCategory,
} from "@/lib/notifications";
import type { NotificationItem, OrganizationMemberInfo } from "@/types/api";

const PAGE_SIZE = 20;

const FILTERS: Array<{ id: "all" | NotificationCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "posts", label: "Posts" },
  { id: "events", label: "Events" },
  { id: "challenges", label: "Challenges" },
  { id: "security", label: "Security" },
];

const CATEGORY_GLYPH: Record<NotificationCategory, typeof Bell> = {
  posts: MessageSquare,
  events: Calendar,
  challenges: Trophy,
  security: ShieldAlert,
};

function NotificationRow({
  notification,
  actor,
  onOpen,
}: {
  notification: NotificationItem;
  actor: OrganizationMemberInfo | undefined;
  onOpen: () => void;
}) {
  const href = notificationHref(notification);
  const category = notificationCategory(notification);
  const showActor = isActorDriven(notification) && !!actor;
  const actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() : "";
  const body = showActor ? stripActorName(notification.body, actorName) : notification.body;
  const Glyph = category ? CATEGORY_GLYPH[category] : Bell;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full gap-2 px-5 py-4 text-left ${href ? "hover:bg-grey-5" : "cursor-default"}`}
    >
      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-grey-4" : "bg-primary-1"}`} />
      {showActor ? (
        <Avatar
          url={actor?.avatarUrl}
          seed={notification.actorId ?? undefined}
          firstName={actor?.firstName}
          lastName={actor?.lastName}
          size={36}
          showPlaceholderBadge
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grey-5 text-grey-2">
          <Glyph className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        {showActor && <span className="block text-sm font-semibold text-grey-1">{actorName}</span>}
        <span className="block text-sm text-grey-1">{body}</span>
        <span className="mt-1 block text-xs text-grey-3">{formatRelativeTime(notification.createdAt)}</span>
      </span>
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { organizationId } = useDashboardData();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | NotificationCategory>("all");
  const [memberMap, setMemberMap] = useState<Map<string, OrganizationMemberInfo>>(new Map());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await api.notifications.list({ limit: PAGE_SIZE });
      setNotifications(response.items);
      setTotal(response.total);
    } catch (error) {
      setNotifications([]);
      setTotal(0);
      setLoadError(getUserErrorMessage(error, "We couldn't load your notifications. Try again."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  // Actor avatars for "someone acted on you" rows.
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    api.organization.getMembers(organizationId)
      .then((response) => {
        if (!cancelled) setMemberMap(new Map(response.items.map((member) => [member.id, member])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [organizationId]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore) return;
    const offset = notifications.length;
    if (offset >= total) return;
    setIsLoadingMore(true);
    try {
      const response = await api.notifications.list({ limit: PAGE_SIZE, offset });
      setNotifications((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...response.items.filter((item) => !seen.has(item.id))];
      });
      setTotal(response.total);
    } catch (error) {
      toast.error(getUserErrorMessage(error, "We couldn't load more notifications. Try again."));
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, notifications.length, total]);

  const hasMore = notifications.length < total;

  // Prefetch the next page before the list runs out.
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) void loadMore(); },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const openNotification = async (notification: NotificationItem) => {
    const href = notificationHref(notification);
    if (!notification.isRead) {
      try {
        // Awaited before navigating: routing away first loses the read and the
        // row comes back unread.
        await api.notifications.markRead(notification.id);
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, isRead: true } : item
        )));
      } catch (error) {
        toast.error(getUserErrorMessage(error, "We couldn't mark that as read. Try again."));
      }
    }
    if (href) router.push(href);
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      toast.error(getUserErrorMessage(error, "We couldn't mark everything as read. Try again."));
    }
  };

  const visible = useMemo(() => (
    activeFilter === "all"
      ? notifications
      : notifications.filter((item) => notificationCategory(item) === activeFilter)
  ), [notifications, activeFilter]);

  const groups = useMemo(() => groupByDay(visible), [visible]);
  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">Review invitations and updates from your organization.</p>
        </div>
        <button type="button" onClick={markAllRead} disabled={!hasUnread} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-grey-4 bg-white px-4 text-sm font-medium text-grey-1 hover:bg-grey-5 disabled:opacity-50">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <SelectablePill
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            selected={activeFilter === filter.id}
            className="px-3 py-1.5"
          >
            {filter.label}
          </SelectablePill>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-grey-4 bg-white">
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-grey-5" />)}</div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <Bell className="h-8 w-8 text-grey-3" />
            <p role="status" className="text-sm text-grey-2">{loadError}</p>
            <button type="button" onClick={() => void loadNotifications()} className="rounded-lg border border-grey-4 bg-white px-4 py-2 text-sm font-medium text-grey-1 hover:bg-grey-5">
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <Bell className="h-8 w-8 text-grey-3" />
            <p className="text-sm text-grey-2">
              {notifications.length === 0
                ? "You don't have any notifications yet."
                : "Nothing in this category yet."}
            </p>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="border-b border-grey-4 bg-grey-5/40 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-grey-3">
                  {group.label}
                </h2>
                <div className="divide-y divide-grey-4">
                  {group.items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      actor={notification.actorId ? memberMap.get(notification.actorId) : undefined}
                      onOpen={() => void openNotification(notification)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center border-t border-grey-4 py-4">
                {isLoadingMore
                  ? <Loader2 className="h-5 w-5 animate-spin text-grey-3" />
                  : <button type="button" onClick={() => void loadMore()} className="rounded-lg border border-grey-4 bg-white px-4 py-2 text-sm text-grey-2 hover:bg-grey-5">Load more</button>}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
