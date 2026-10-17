// path: components/challenges/create-challenge-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Calendar as CalendarIcon } from "iconsax-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { FieldError } from "@/components/onboarding/field-error";
import { api } from "@/services/api";
import { ApiError } from "@/services/http";
import { useDashboardData } from "@/components/providers/dashboard-data-provider";
import { useDashboardScope } from "@/lib/scope";
import { getCreatableBranches } from "@/lib/permissions";
import type { ChallengeTrackingMethod, WellbeingChallenge } from "@/types/api";

const TARGET_TYPES = ["cumulative", "daily_minimum"];
const METRIC_TYPES = ["steps", "calories", "distance_km", "minutes_active", "workouts"];
type TrackingMethod = ChallengeTrackingMethod;

export function CreateChallengeModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { organizationId, currentUser, branches: orgBranches } = useDashboardData();
  const { scope } = useDashboardScope();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [metricType, setMetricType] = useState(METRIC_TYPES[0]);
  const [trackingMethod, setTrackingMethod] = useState<TrackingMethod>("automatic");
  const [activityLabel, setActivityLabel] = useState("");
  const [evidenceRequired, setEvidenceRequired] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [targetType, setTargetType] = useState(TARGET_TYPES[0]);
  const [targetValue, setTargetValue] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedWellbeingChallengeId, setSelectedWellbeingChallengeId] = useState<string>("");
  const [wellbeingChallenges, setWellbeingChallenges] = useState<WellbeingChallenge[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Image upload state — mediaUrl (from /storage/upload-url) is what
  // actually gets sent to createChallenge as imageUrl, never a raw
  // client-side path or the file itself.
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const creatable = currentUser ? getCreatableBranches(currentUser.permissions, "branch.create") : null;

  useEffect(() => {
    if (!isOpen || !organizationId) return;
    void api.wellbeing.getChallenges().then((res) => setWellbeingChallenges(res.items));
  }, [isOpen, organizationId]);

  const reset = () => {
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setMetricType(METRIC_TYPES[0]);
    setTrackingMethod("automatic");
    setActivityLabel("");
    setEvidenceRequired(false);
    setRequiresApproval(false);
    setTargetType(TARGET_TYPES[0]);
    setTargetValue("");
    setSelectedBranchId("");
    setSelectedWellbeingChallengeId("");
    setFieldErrors({});
    setGeneralError(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setIsUploadingImage(false);
  };

  const clearErrors = () => {
    if (Object.keys(fieldErrors).length > 0) setFieldErrors({});
    if (generalError) setGeneralError(null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearErrors();
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl(null);
    setIsUploadingImage(true);

    try {
      const { uploadUrl, mediaUrl } = await api.storage.requestUploadUrl({
        domain: "challenges",
        contentType: file.type,
      });

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) throw new Error("Upload failed");

      setUploadedImageUrl(mediaUrl);
    } catch {
      toast.error("Image upload failed. You can retry or create the challenge without an image.");
      setImagePreview(null);
      setUploadedImageUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
  };

  const validateChallengeDates = () => {
    if (!startDate || !endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (start < today) return "Start date cannot be in the past.";
    if (end < today) return "End date cannot be in the past.";
    if (end <= start) return "End date must be after the start date.";

    return null;
  };

  const showActivityLabel = trackingMethod === "self_reported" || trackingMethod === "evidence_based";
  const isEvidenceBased = trackingMethod === "evidence_based";

  const branchIdToSend =
    scope.type === "branch" ? scope.branchId : selectedBranchId || undefined;

  const branchOptions = creatable
    ? orgBranches.filter((b) => creatable.canCreateOrgWide || creatable.branchIds.includes(b.id))
    : [];

  const isValid =
    name.trim() &&
    description.trim() &&
    startDate &&
    endDate &&
    metricType.trim() &&
    targetValue &&
    (scope.type === "branch" || creatable?.canCreateOrgWide || selectedBranchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !isValid) return;

    if (isUploadingImage) {
      toast.error("Please wait for the image to finish uploading.");
      return;
    }

    const dateError = validateChallengeDates();
    if (dateError) {
      setGeneralError(dateError);
      toast.error(dateError);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);
    try {
      await api.organization.createChallenge(organizationId, {
        branchId: branchIdToSend,
        wellbeingChallengeId: selectedWellbeingChallengeId || undefined,
        name: name.trim(),
        description: description.trim(),
        imageUrl: uploadedImageUrl ?? undefined,
        startDate,
        endDate,
        metricType: metricType.trim(),
        targetType,
        targetValue: Number(targetValue),
        trackingMethod,
        activityLabel: showActivityLabel ? activityLabel.trim() || undefined : undefined,
        evidenceRequired: trackingMethod === "evidence_based" ? evidenceRequired : undefined,
        requiresApproval: trackingMethod === "evidence_based" ? requiresApproval : undefined,
      });
      toast.success("Challenge created");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        } else {
          setGeneralError(err.message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      presentation="drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Challenge"
      footer={
        <>
          <Button type="button" variant="outline" className="border-grey-4 bg-white text-grey-2 hover:bg-grey-5" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-challenge-form" disabled={!isValid || isSubmitting || isUploadingImage}>
            {isSubmitting ? "Creating..." : "Create Challenge"}
          </Button>
        </>
      }
    >
      <form id="create-challenge-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{generalError}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="wellbeingChallenge">Based on a wellbeing challenge (optional)</Label>
          <FilterDropdown
            id="wellbeingChallenge"
            ariaLabel="Based on a wellbeing challenge"
            value={selectedWellbeingChallengeId}
            onValueChange={setSelectedWellbeingChallengeId}
            options={[{ value: "", label: "None, custom challenge" }, ...wellbeingChallenges.map((wc) => ({ value: wc.id, label: wc.name }))]}
            buttonClassName="h-11 w-full font-normal"
            menuClassName="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="challengeName">Challenge Name</Label>
          <Input
            id="challengeName"
            placeholder="e.g. 10k Steps a Day"
            className="text-left placeholder:text-left"
            value={name}
            onChange={(e) => { setName(e.target.value); clearErrors(); }}
            required
          />
          <FieldError errors={fieldErrors} field="name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="challengeDescription">Description</Label>
          <textarea
            id="challengeDescription"
            className="w-full p-4 rounded-[8px] border border-grey-4 bg-white text-sm text-left placeholder:text-left focus:outline-none focus:ring-2 focus:ring-primary-1 min-h-[100px] resize-none"
            placeholder="Describe the challenge goals and rules..."
            value={description}
            onChange={(e) => { setDescription(e.target.value); clearErrors(); }}
            required
          />
          <FieldError errors={fieldErrors} field="description" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="challengeImage">Challenge Image (optional)</Label>
          {imagePreview ? (
            <div className="relative h-[140px] w-full rounded-[8px] overflow-hidden border border-grey-4 bg-grey-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Challenge preview" className="h-full w-full object-cover" />
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-grey-1 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="challengeImage"
              className="flex h-[100px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-grey-4 bg-grey-5 text-grey-3 hover:border-primary-1 hover:text-primary-1"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-xs">Click to upload an image</span>
              <input id="challengeImage" type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>
          )}
          <FieldError errors={fieldErrors} field="image_url" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative">
              <Input id="startDate" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); clearErrors(); }} className="w-full pr-11 [&::-webkit-calendar-picker-indicator]:opacity-0" required />
              <button type="button" aria-label="Choose start date" onClick={() => document.querySelector<HTMLInputElement>("#startDate")?.showPicker?.()} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-grey-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1"><CalendarIcon size="18" aria-hidden="true" /></button>
            </div>
            <FieldError errors={fieldErrors} field="start_date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <div className="relative">
              <Input id="endDate" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); clearErrors(); }} className="w-full pr-11 [&::-webkit-calendar-picker-indicator]:opacity-0" required />
              <button type="button" aria-label="Choose end date" onClick={() => document.querySelector<HTMLInputElement>("#endDate")?.showPicker?.()} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-grey-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1"><CalendarIcon size="18" aria-hidden="true" /></button>
            </div>
            <FieldError errors={fieldErrors} field="end_date" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trackingMethod">How progress is tracked</Label>
          <FilterDropdown id="trackingMethod" ariaLabel="How progress is tracked" value={trackingMethod} onValueChange={(value) => { setTrackingMethod(value as TrackingMethod); clearErrors(); }} options={[
            { value: "automatic", label: "Automatic, phone or wearable health data" },
            { value: "self_reported", label: "Self-reported, mark the activity complete" },
            { value: "evidence_based", label: "Evidence-based, photo and optional notes" },
            { value: "platform_recorded", label: "Platform recorded, event, club or in-app activity" },
          ]} buttonClassName="h-11 w-full font-normal" menuClassName="w-full" />
          <p className="text-xs text-grey-3">Automatic metrics cannot be typed by participants; they must arrive from a connected device.</p>
        </div>

        {showActivityLabel && (
          <div className="space-y-2">
            <Label htmlFor="activityLabel">Activity</Label>
            <Input
              id="activityLabel"
              placeholder="e.g. Prepare a healthy meal containing vegetables"
              className="text-left placeholder:text-left"
              value={activityLabel}
              onChange={(e) => { setActivityLabel(e.target.value); clearErrors(); }}
            />
            <FieldError errors={fieldErrors} field="activity_label" />
          </div>
        )}

        {isEvidenceBased && (
          <div className="grid grid-cols-2 gap-4">
            <button type="button" aria-pressed={evidenceRequired} onClick={() => { setEvidenceRequired(!evidenceRequired); clearErrors(); }} className={`min-h-11 rounded-[8px] border px-3 text-sm ${evidenceRequired ? "border-black text-black" : "border-grey-4 text-grey-2"}`}>Evidence required</button>
            <button type="button" aria-pressed={requiresApproval} onClick={() => { setRequiresApproval(!requiresApproval); clearErrors(); }} className={`min-h-11 rounded-[8px] border px-3 text-sm ${requiresApproval ? "border-black text-black" : "border-grey-4 text-grey-2"}`}>Requires admin approval</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="metricType">Metric Type</Label>
            <FilterDropdown
              id="metricType"
              ariaLabel="Metric Type"
              value={metricType}
              onValueChange={(value) => { setMetricType(value); clearErrors(); }}
              options={METRIC_TYPES.map((value) => ({ value, label: value.replace(/_/g, " ") }))}
              buttonClassName="h-11 w-full font-normal" menuClassName="w-full"
            />
            <FieldError errors={fieldErrors} field="metric_type" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetType">Target Type</Label>
            <FilterDropdown
              id="targetType"
              ariaLabel="Target Type"
              value={targetType}
              onValueChange={(value) => { setTargetType(value); clearErrors(); }}
              options={TARGET_TYPES.map((value) => ({ value, label: value.replace(/_/g, " ") }))}
              buttonClassName="h-11 w-full font-normal" menuClassName="w-full"
            />
            <FieldError errors={fieldErrors} field="target_type" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetValue">{targetType === "daily_minimum" ? "Daily" : "Total"} {metricType.replace(/_/g, " ")} goal</Label>
          <Input
            id="targetValue"
            type="number"
            min="0"
            step="any"
            placeholder="10000"
            className="text-left placeholder:text-left"
            value={targetValue}
            onChange={(e) => { setTargetValue(e.target.value); clearErrors(); }}
            required
          />
          <FieldError errors={fieldErrors} field="target_value" />
        </div>

        {scope.type === "overview" && creatable && !creatable.canCreateOrgWide && (
          <div className="space-y-2">
            <Label htmlFor="branchSelect">Branch</Label>
            <FilterDropdown
              id="branchSelect"
              ariaLabel="Branch"
              value={selectedBranchId}
              onValueChange={(value) => { setSelectedBranchId(value); clearErrors(); }}
              options={[{ value: "", label: "Select a branch" }, ...branchOptions.map((branch) => ({ value: branch.id, label: branch.name }))]}
              buttonClassName="h-11 w-full font-normal" menuClassName="w-full"
            />
            <FieldError errors={fieldErrors} field="branch_id" />
          </div>
        )}

        {scope.type === "overview" && creatable?.canCreateOrgWide && (
          <div className="space-y-2">
            <Label htmlFor="branchSelectWide">Branch (optional, leave blank for General)</Label>
            <FilterDropdown
              id="branchSelectWide"
              ariaLabel="Branch"
              value={selectedBranchId}
              onValueChange={(value) => { setSelectedBranchId(value); clearErrors(); }}
              options={[{ value: "", label: "General" }, ...branchOptions.map((branch) => ({ value: branch.id, label: branch.name }))]}
              buttonClassName="h-11 w-full font-normal" menuClassName="w-full"
            />
            <FieldError errors={fieldErrors} field="branch_id" />
          </div>
        )}
      </form>
    </Modal>
  );
}
