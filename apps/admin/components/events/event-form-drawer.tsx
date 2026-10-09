"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@wellstaq/ui/modal";
import { Button } from "@wellstaq/ui/button";
import { Input } from "@wellstaq/ui/input";
import { Label } from "@wellstaq/ui/label";
import { cn } from "@wellstaq/ui/utils";
import { primaryButton, secondaryButton } from "@/components/ui/button-styles";
import { AUDIENCE_OPTIONS } from "@/components/events/audience";
import { OrganizationPicker, type PickedOrganization } from "@/components/events/organization-picker";
import { adminApi } from "@/services/admin-api";
import { ApiError } from "@/services/http";
import type { EventAudience, PlatformEvent, PlatformEventInput } from "@/types/admin";

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 2000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function timezoneOptions(current: string): string[] {
  let zones: string[] = [];
  try {
    zones = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    zones = [];
  }
  return Array.from(new Set([current, "UTC", ...zones]));
}

function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

interface FormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
  timezone: string;
  audience: EventAudience;
  organizations: PickedOrganization[];
}

function initialState(event?: PlatformEvent | null): FormState {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    startDate: event?.startDate ?? "",
    endDate: event?.endDate ?? "",
    time: event?.time?.slice(0, 5) ?? "",
    timezone: event?.timezone ?? browserTimezone(),
    audience: event?.audience ?? "everyone",
    organizations: event?.organizations ?? [],
  };
}

export function EventFormDrawer({
  isOpen,
  onClose,
  event,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** Pass an event to edit it; omit to create a new one. */
  event?: PlatformEvent | null;
  onSaved: (event: PlatformEvent) => void;
}) {
  const isEditing = Boolean(event);
  const [form, setForm] = useState<FormState>(() => initialState(event));
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Same pattern as the org app: upload on select, keep the returned media URL, send that on submit.
  const [imagePreview, setImagePreview] = useState<string | null>(event?.imageUrl ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(event?.imageUrl ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(initialState(event));
    setTouched(false);
    setServerError(null);
    setFieldErrors({});
    setImagePreview(event?.imageUrl ?? null);
    setImageUrl(event?.imageUrl ?? null);
    setIsUploadingImage(false);
  }, [isOpen, event]);

  const zones = useMemo(() => timezoneOptions(form.timezone), [form.timezone]);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const errors: Record<string, string> = { ...fieldErrors };
  if (!form.title.trim()) errors.title ??= "Add a title.";
  if (!form.startDate) errors.startDate ??= "Choose a date.";
  else if (!isEditing && form.startDate < today()) errors.startDate ??= "Choose today or a later date.";
  if (!form.time) errors.time ??= "Choose a start time.";
  if (form.endDate && form.startDate && form.endDate < form.startDate) errors.endDate ??= "End date can't be before the start date.";
  if (form.audience === "selected_organizations" && form.organizations.length === 0) errors.organizationIds ??= "Choose at least one organization.";
  const isValid = Object.keys(errors).length === 0;
  const showError = (key: string) => (touched || fieldErrors[key] ? errors[key] : undefined);

  const handleImageSelect = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Images must be 5 MB or smaller.");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setImageUrl(null);
    setIsUploadingImage(true);
    try {
      const { uploadUrl, mediaUrl } = await adminApi.storage.requestUploadUrl(file.type);
      const response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Upload failed");
      setImageUrl(mediaUrl);
    } catch {
      toast.error("The image didn't upload. Try again, or save the event without an image.");
      setImagePreview(null);
      setImageUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const submit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    setTouched(true);
    setFieldErrors({});
    if (!isValid || isUploadingImage) return;

    const input: PlatformEventInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      imageUrl,
      startDate: form.startDate,
      endDate: form.endDate || null,
      time: form.time,
      timezone: form.timezone,
      audience: form.audience,
      organizationIds: form.audience === "selected_organizations" ? form.organizations.map((organization) => organization.id) : [],
    };

    setIsSubmitting(true);
    setServerError(null);
    try {
      const saved = event ? await adminApi.events.update(event.id, input) : await adminApi.events.create(input);
      toast.success(isEditing ? "Event updated" : "Event created");
      onSaved(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) setFieldErrors(error.fieldErrors);
        setServerError(error.fieldErrors ? "Check the highlighted fields." : error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldId = (name: string) => `platform-event-${name}`;
  const describedBy = (name: string, help?: boolean) => [showError(name) ? `${fieldId(name)}-error` : null, help ? `${fieldId(name)}-help` : null].filter(Boolean).join(" ") || undefined;
  const ErrorText = ({ name }: { name: string }) => (showError(name) ? <p id={`${fieldId(name)}-error`} className="text-xs text-error-1">{showError(name)}</p> : null);

  return (
    <Modal
      presentation="drawer"
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={isEditing ? "Edit event" : "Create event"}
      subtitle={isEditing ? "Changes are shown to everyone in the event's audience." : "Platform events appear on the dashboards of the audience you choose."}
      footer={
        <>
          <Button type="button" className={secondaryButton} onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="platform-event-form" className={primaryButton} disabled={isSubmitting || isUploadingImage}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create event"}
          </Button>
        </>
      }
    >
      <form id="platform-event-form" onSubmit={submit} noValidate className="space-y-5">
        {serverError && <p role="alert" className="rounded-[8px] border border-error-4 bg-error-5 px-3 py-2 text-sm text-error-1">{serverError}</p>}

        <div className="space-y-2">
          <Label htmlFor={fieldId("title")} className="text-sm font-medium text-grey-1">Event title</Label>
          <Input id={fieldId("title")} value={form.title} maxLength={MAX_TITLE} onChange={(e) => update("title", e.target.value)} aria-invalid={Boolean(showError("title")) || undefined} aria-describedby={describedBy("title")} />
          <ErrorText name="title" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("startDate")} className="text-sm font-medium text-grey-1">Date</Label>
            <Input id={fieldId("startDate")} type="date" value={form.startDate} min={isEditing ? undefined : today()} onChange={(e) => update("startDate", e.target.value)} aria-invalid={Boolean(showError("startDate")) || undefined} aria-describedby={describedBy("startDate")} />
            <ErrorText name="startDate" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("time")} className="text-sm font-medium text-grey-1">Time</Label>
            <Input id={fieldId("time")} type="time" value={form.time} onChange={(e) => update("time", e.target.value)} aria-invalid={Boolean(showError("time")) || undefined} aria-describedby={describedBy("time")} />
            <ErrorText name="time" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("timezone")} className="text-sm font-medium text-grey-1">Time zone</Label>
            <select id={fieldId("timezone")} value={form.timezone} onChange={(e) => update("timezone", e.target.value)} className="h-12 w-full border border-line bg-white text-sm">
              {zones.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("endDate")} className="text-sm font-medium text-grey-1">End date (optional)</Label>
            <Input id={fieldId("endDate")} type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => update("endDate", e.target.value)} aria-invalid={Boolean(showError("endDate")) || undefined} aria-describedby={describedBy("endDate")} />
            <ErrorText name="endDate" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("description")} className="text-sm font-medium text-grey-1">Description</Label>
          <textarea
            id={fieldId("description")}
            value={form.description}
            maxLength={MAX_DESCRIPTION}
            onChange={(e) => update("description", e.target.value)}
            aria-describedby={`${fieldId("description")}-help`}
            className="min-h-[100px] w-full resize-none rounded-[8px] border border-line bg-white p-4 text-sm text-grey-1 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
          />
          <p id={`${fieldId("description")}-help`} className="text-right text-xs text-grey-2">{form.description.length}/{MAX_DESCRIPTION}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("image")} className="text-sm font-medium text-grey-1">Event image (optional)</Label>
          {imagePreview ? (
            <div className="relative h-[140px] w-full overflow-hidden rounded-[8px] border border-line bg-grey-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Event image preview" className="h-full w-full object-cover" />
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40" role="status" aria-label="Uploading image">
                  <Loader2 className="h-6 w-6 animate-spin text-white motion-reduce:animate-none" aria-hidden="true" />
                </div>
              )}
              <button type="button" onClick={() => { setImagePreview(null); setImageUrl(null); }} aria-label="Remove image" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-grey-1 hover:bg-white">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label htmlFor={fieldId("image")} className="flex h-[100px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-line bg-grey-5 text-grey-2 hover:border-primary-1 hover:text-primary-hover focus-within:ring-2 focus-within:ring-primary-1/30">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">Upload an image (PNG or JPG, up to 5 MB)</span>
              <input id={fieldId("image")} type="file" accept="image/*" className="sr-only" onChange={(e) => void handleImageSelect(e.currentTarget)} />
            </label>
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-medium text-grey-1">Who can see this event</legend>
          <div className="grid grid-cols-1 gap-2">
            {AUDIENCE_OPTIONS.map((option) => {
              const selected = form.audience === option.value;
              return (
                <label key={option.value} className={cn("flex cursor-pointer items-start gap-3 rounded-[8px] border p-3 transition-colors", selected ? "border-primary-1 bg-primary-5" : "border-line bg-white hover:bg-grey-5")}>
                  <input type="radio" name="audience" value={option.value} checked={selected} onChange={() => update("audience", option.value)} className="mt-0.5 h-4 w-4 accent-[#C45700]" />
                  <span>
                    <span className="block text-sm font-medium text-grey-1">{option.label}</span>
                    <span className="block text-xs leading-5 text-grey-2">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {form.audience === "selected_organizations" && (
            <div className="space-y-2 pt-1">
              <OrganizationPicker value={form.organizations} onChange={(organizations) => update("organizations", organizations)} invalid={Boolean(showError("organizationIds"))} />
              <ErrorText name="organizationIds" />
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
