import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, CalendarDays, Clock } from "@wellstaq/ui/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatTime, plural } from "@/lib/format";
import type { EventStatus } from "@/types/admin";

interface EventCardProps {
  title: string;
  imageUrl: string | null;
  startDate: string;
  time: string;
  status: EventStatus;
  participantCount: number;
  maxParticipants?: number | null;
  meta?: ReactNode;
  href?: string;
}

/** Mirrors the event card in the organization app so events look the same everywhere. */
export function EventCard({ title, imageUrl, startDate, time, status, participantCount, maxParticipants, meta, href }: EventCardProps) {
  const isSoldOut = (status === "scheduled" || status === "ongoing") && maxParticipants != null && maxParticipants > 0 && participantCount >= maxParticipants;
  const content = (
    <>
      <div className="relative h-[85px] w-full shrink-0 overflow-hidden rounded-lg bg-grey-4">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-grey-3" aria-hidden="true">
            <CalendarDays className="h-6 w-6" strokeWidth={1.6} />
          </span>
        )}
        <StatusBadge status={status} className="absolute left-2 top-2 bg-white/95" />
        {isSoldOut && <span className="absolute right-2 top-2 rounded-md bg-grey-1 px-2 py-1 text-xs font-medium text-white">Sold out</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-1 pb-1">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-1 font-sans text-sm font-medium leading-5 text-grey-2">{title}</h3>
          <p className="flex items-center justify-between gap-1 text-xs leading-[18px] text-grey-2">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(startDate)}
          </p>
          <p className="flex items-center justify-between gap-1 text-xs leading-[18px] text-grey-2">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(time)}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 text-xs leading-[18px] text-grey-2">
          <span>{maxParticipants != null && maxParticipants > 0 ? `${participantCount}/${maxParticipants} participants` : plural(participantCount, "participant")}</span>
          {meta}
        </div>
      </div>
    </>
  );

  const className = "flex h-[236px] flex-col gap-2 overflow-hidden rounded-lg border border-[#F0F0F0] bg-grey-5 p-2";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-line hover:bg-white focus-visible:bg-white`}>
      {content}
    </Link>
  ) : (
    <article className={className}>{content}</article>
  );
}
