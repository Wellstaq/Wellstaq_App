export type ActivityStatus = "upcoming" | "active" | "completed" | "cancelled" | "archived";

function calendarDay(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function dayNumber(value: Date): number {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86_400_000;
}

/** Date-only end dates include the whole final day, rather than ending at midnight. */
export function activitySchedule(
  item: { startDate: string; endDate: string | null; status: string; time?: string },
  now = new Date(),
): { status: ActivityStatus; countdown: string } {
  if (["cancelled", "canceled", "archived", "completed"].includes(item.status)) {
    const status = item.status === "canceled" ? "cancelled" : item.status as ActivityStatus;
    return { status, countdown: status === "completed" ? "Finished" : status === "archived" ? "Archived" : "Cancelled" };
  }
  const start = calendarDay(item.startDate);
  const end = item.endDate ? calendarDay(item.endDate) : null;
  const startsAt = item.time ? new Date(`${item.startDate.slice(0, 10)}T${item.time}`) : start;
  if (![start, startsAt, ...(end ? [end] : [])].every((date) => Number.isFinite(date.getTime()))) {
    return { status: item.status === "active" || item.status === "ongoing" ? "active" : "upcoming", countdown: "Dates unavailable" };
  }
  if (end && dayNumber(now) > dayNumber(end)) return { status: "completed", countdown: "Finished" };
  if (now < startsAt) {
    const days = Math.max(0, dayNumber(start) - dayNumber(now));
    return { status: "upcoming", countdown: days === 0 ? "Starts today" : `${days} day${days === 1 ? "" : "s"} until start` };
  }
  if (!end) return { status: "active", countdown: "End date not set" };
  const days = Math.max(0, dayNumber(end) - dayNumber(now));
  return { status: "active", countdown: days === 0 ? "Ends today" : `${days} day${days === 1 ? "" : "s"} until finish` };
}
