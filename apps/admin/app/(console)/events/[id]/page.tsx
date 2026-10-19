"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Calendar, CalendarDays, Clock, Edit2, Globe2, Trash2, Users } from "@wellstaq/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/controls";
import { BackLink } from "@/components/ui/back-link";
import { ErrorPanel } from "@/components/ui/states";
import { DetailSkeleton } from "@/components/ui/skeletons";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionDialog } from "@/components/ui/action-dialog";
import { dangerButton, secondaryButton } from "@/components/ui/button-styles";
import { EventFormDrawer } from "@/components/events/event-form-drawer";
import { AUDIENCE_OPTIONS } from "@/components/events/audience";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { can } from "@/lib/permissions";
import { formatDate, formatDateTime, formatTime, plural } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

export default function PlatformEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const admin = useAdmin();
  const router = useRouter();
  const canManage = can(admin, "events.manage");
  const event = useResource((signal) => adminApi.events.get(id, { signal }), [id]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dialog, setDialog] = useState<"cancel" | "delete" | null>(null);

  if (event.isLoading && !event.data) return <DetailSkeleton />;
  if (event.error || !event.data) {
    return (
      <>
        <BackLink href="/events">Back to events</BackLink>
        <section className="rounded-[14px] border border-line bg-white">
          {event.error && <ErrorPanel error={event.error} onRetry={event.reload} />}
        </section>
      </>
    );
  }

  const data = event.data;
  const audience = AUDIENCE_OPTIONS.find((option) => option.value === data.audience);
  const isClosed = data.status === "cancelled" || data.status === "completed";

  return (
    <>
      <BackLink href="/events">Back to events</BackLink>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <article className="overflow-hidden rounded-[14px] border border-line bg-white lg:col-span-2">
          <div className="relative h-[220px] w-full bg-grey-4 sm:h-[300px]">
            {data.imageUrl ? (
              <Image src={data.imageUrl} alt="" fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" referrerPolicy="no-referrer" priority />
            ) : (
              <span className="flex h-full items-center justify-center text-grey-3" aria-hidden="true"><CalendarDays className="h-10 w-10" strokeWidth={1.4} /></span>
            )}
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <StatusBadge status={data.status} />
                <h1 className="page-title break-words">{data.title}</h1>
              </div>
              {canManage && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!isClosed && (
                    <Button type="button" size="sm" className={secondaryButton} onClick={() => setIsEditOpen(true)}>
                      <Edit2 className="h-4 w-4" aria-hidden="true" /> Edit
                    </Button>
                  )}
                  {data.status === "scheduled" && (
                    <Button type="button" size="sm" className={secondaryButton} onClick={() => setDialog("cancel")}>
                      <Ban className="h-4 w-4" aria-hidden="true" /> Cancel event
                    </Button>
                  )}
                  <Button type="button" size="sm" className={dangerButton} onClick={() => setDialog("delete")}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                  </Button>
                </div>
              )}
            </div>

            <dl className="grid grid-cols-1 gap-4 rounded-[12px] border border-line bg-grey-5 p-4 text-sm sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-grey-2" aria-hidden="true" />
                <div><dt className="text-xs text-grey-2">Date</dt><dd className="font-medium text-grey-1">{formatDate(data.startDate)}{data.endDate && data.endDate !== data.startDate ? ` to ${formatDate(data.endDate)}` : ""}</dd></div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-grey-2" aria-hidden="true" />
                <div><dt className="text-xs text-grey-2">Time</dt><dd className="font-medium text-grey-1">{formatTime(data.time)} <span className="font-normal text-grey-2">({data.timezone.replace(/_/g, " ")})</span></dd></div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-grey-2" aria-hidden="true" />
                <div><dt className="text-xs text-grey-2">Joined</dt><dd className="font-medium text-grey-1">{plural(data.participantCount, "person", "people")}</dd></div>
              </div>
            </dl>

            <div>
              <h2 className="mb-2 font-sans text-sm font-semibold text-grey-1">About this event</h2>
              <p className="whitespace-pre-line text-sm leading-6 text-grey-2">{data.description || "No description added."}</p>
            </div>
          </div>
        </article>

        <aside className="space-y-5">
          <section className="dashboard-card !p-5">
            <h2 className="mb-1 flex items-center justify-between gap-2 font-sans text-sm font-semibold text-grey-1">
              <Globe2 className="h-4 w-4 text-grey-2" aria-hidden="true" /> Audience
            </h2>
            <p className="text-sm font-medium text-grey-1">{audience?.label ?? "Unknown audience"}</p>
            <p className="mt-1 text-xs leading-5 text-grey-2">{audience?.description}</p>
            {data.audience === "selected_organizations" && data.organizations.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                {data.organizations.map((organization) => (
                  <li key={organization.id}>
                    <Link href={`/organizations/${organization.id}`} className="text-sm text-grey-1 hover:text-primary-hover hover:underline">{organization.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="dashboard-card !p-5 text-sm">
            <h2 className="mb-3 font-sans text-sm font-semibold text-grey-1">Details</h2>
            <dl className="space-y-3">
              <div><dt className="text-xs text-grey-2">Created by</dt><dd className="text-grey-1">{data.createdBy?.name ?? "Unknown"}</dd></div>
              <div><dt className="text-xs text-grey-2">Created</dt><dd className="text-grey-1">{formatDateTime(data.createdAt)}</dd></div>
              {data.updatedAt && <div><dt className="text-xs text-grey-2">Last updated</dt><dd className="text-grey-1">{formatDateTime(data.updatedAt)}</dd></div>}
            </dl>
          </section>
        </aside>
      </div>

      <EventFormDrawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} event={data} onSaved={(saved) => event.setData(() => saved)} />

      <ActionDialog
        isOpen={dialog === "cancel"}
        onClose={() => setDialog(null)}
        title="Cancel this event?"
        description="Everyone in the audience will see it as canceled. People who joined are notified. You can't undo this."
        confirmLabel="Cancel event"
        pendingLabel="Canceling..."
        destructive
        onConfirm={async () => {
          const updated = await adminApi.events.cancel(data.id);
          event.setData(() => updated);
          toast.success("Event canceled");
        }}
      />
      <ActionDialog
        isOpen={dialog === "delete"}
        onClose={() => setDialog(null)}
        title="Delete this event?"
        description="The event is removed from every dashboard, along with who joined it. This can't be undone. To keep a record, cancel it instead."
        confirmLabel="Delete event"
        pendingLabel="Deleting..."
        destructive
        onConfirm={async () => {
          await adminApi.events.remove(data.id);
          toast.success("Event deleted");
          router.replace("/events");
        }}
      />
    </>
  );
}
