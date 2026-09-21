import type { NotificationItem } from "@/types/api";

/** Shared notification vocabulary — categories, deep links and row wording live
 *  here so the list, its filters and anything added later cannot disagree. */

export type NotificationCategory = "posts" | "events" | "challenges" | "security";

/** `notification_type` is a free-form string: no enum, and no server-side
 *  filter. Categories are therefore matched here, by keyword and most specific
 *  first — `challenge` is tested before `comment` so `challenge_comment` lands
 *  under Challenges rather than Posts. Anything unmatched gets no category and
 *  still appears under All; a notification is never hidden for failing to
 *  match. */
const CATEGORY_RULES: Array<{ category: NotificationCategory; match: RegExp }> = [
  { category: "security", match: /security|login|sign_?in|password|2fa|session|device|suspicious/i },
  { category: "challenges", match: /challenge/i },
  { category: "events", match: /event/i },
  { category: "posts", match: /post|comment|reply|mention|like|share|story|club|follow|hashtag/i },
];

export function notificationCategory(notification: NotificationItem): NotificationCategory | null {
  const haystack = `${notification.notificationType} ${notification.referenceType ?? ""}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(haystack)) return rule.category;
  }
  return null;
}

/** Where a notification leads. Anything unrecognised returns null so the row
 *  renders as plain text rather than a link that goes nowhere. */
export function notificationHref(notification: NotificationItem): string | null {
  const id = notification.referenceId;
  if (!id) return null;
  const ref = encodeURIComponent(id);
  switch (notification.referenceType) {
    case "event": return `/dashboard/events/${ref}`;
    case "challenge": return `/dashboard/challenges/${ref}`;
    case "club": return `/dashboard/clubs?clubId=${ref}`;
    case "story": return `/dashboard/space?storyId=${ref}`;
    // A comment notification references the post the comment belongs to: there
    // is no endpoint that resolves a bare comment id back to its post.
    case "post":
    case "comment": return `/dashboard/space?postId=${ref}#post-${ref}`;
    default: return null;
  }
}

const ACTOR_DRIVEN = /like|comment|reply|mention|share|follow/i;

/** True when someone acted on you, and so the row should lead with their
 *  avatar rather than a category glyph. */
export function isActorDriven(notification: NotificationItem): boolean {
  return !!notification.actorId && ACTOR_DRIVEN.test(notification.notificationType);
}

/** When the actor's name is already the row heading, drop it from the body so
 *  the row does not read "Yemi — Yemi liked your post". */
export function stripActorName(body: string, actorName: string): string {
  const trimmed = body.trim();
  const name = actorName.trim();
  if (!name || !trimmed.toLowerCase().startsWith(name.toLowerCase())) return trimmed;
  const rest = trimmed.slice(name.length).replace(/^[\s,:;—–-]+/, "");
  if (!rest) return trimmed;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

const MS_PER_DAY = 86_400_000;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Today / Yesterday / a date, so the list reads as days rather than one flat
 *  run of rows. */
export function dayLabel(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const days = Math.round((startOfDay(now) - startOfDay(date)) / MS_PER_DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/** Groups in the order given, which is the order the API returns (newest
 *  first). */
export function groupByDay(
  notifications: NotificationItem[],
  now: Date = new Date(),
): Array<{ label: string; items: NotificationItem[] }> {
  const groups: Array<{ label: string; items: NotificationItem[] }> = [];
  for (const notification of notifications) {
    const label = dayLabel(notification.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(notification);
    else groups.push({ label, items: [notification] });
  }
  return groups;
}
