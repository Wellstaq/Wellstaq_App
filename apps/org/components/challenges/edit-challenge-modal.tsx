// path: components/challenges/edit-challenge-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { BooleanRadio } from "@wellstaq/ui/boolean-radio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useDashboardData } from "@/components/providers/dashboard-data-provider";
import type { ChallengeItem, ChallengeTrackingMethod } from "@/types/api";

export function EditChallengeModal({
  isOpen,
  onClose,
  challenge,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  challenge: ChallengeItem;
  onUpdated: (updated: ChallengeItem) => void;
}) {
  const { organizationId } = useDashboardData();
  const [name, setName] = useState(challenge.name);
  const [description, setDescription] = useState(challenge.description);
  const [startDate, setStartDate] = useState(challenge.startDate);
  const [endDate, setEndDate] = useState(challenge.endDate);
  const [targetValue, setTargetValue] = useState(challenge.targetValue);
  const [trackingMethod, setTrackingMethod] = useState<ChallengeTrackingMethod>(challenge.trackingMethod);
  const [activityLabel, setActivityLabel] = useState(challenge.activityLabel ?? "");
  const [evidenceRequired, setEvidenceRequired] = useState(challenge.evidenceRequired);
  const [requiresApproval, setRequiresApproval] = useState(challenge.requiresApproval);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showActivityLabel = trackingMethod === "self_reported" || trackingMethod === "evidence_based";
  const isEvidenceBased = trackingMethod === "evidence_based";

  useEffect(() => {
    if (!isOpen) return;
    setName(challenge.name);
    setDescription(challenge.description);
    setStartDate(challenge.startDate);
    setEndDate(challenge.endDate);
    setTargetValue(challenge.targetValue);
    setTrackingMethod(challenge.trackingMethod);
    setActivityLabel(challenge.activityLabel ?? "");
    setEvidenceRequired(challenge.evidenceRequired);
    setRequiresApproval(challenge.requiresApproval);
  }, [isOpen, challenge]);


  const validateChallengeDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (start < today) return "Start date cannot be in the past.";
    if (end < today) return "End date cannot be in the past.";
    if (end <= start) return "End date must be after the start date.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    const dateError = validateChallengeDates();
    if (dateError) {
      toast.error(dateError);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.organization.updateChallenge(organizationId, challenge.id, {
        name,
        description,
        startDate,
        endDate,
        targetValue: Number(targetValue),
        trackingMethod,
        activityLabel: showActivityLabel ? activityLabel.trim() || undefined : undefined,
        evidenceRequired: isEvidenceBased ? evidenceRequired : undefined,
        requiresApproval: isEvidenceBased ? requiresApproval : undefined,
      });
      toast.success("Challenge updated");
      onUpdated(updated);
      onClose();
    } catch {
      // error toast handled globally
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      presentation="drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Challenge"
      footer={
        <>
          <Button type="button" variant="outline" className="border-grey-4 bg-white text-grey-2 hover:bg-grey-5" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-challenge-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="edit-challenge-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="editName">Name</Label>
          <Input id="editName" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editDescription">Description</Label>
          <textarea
            id="editDescription"
            className="w-full p-4 rounded-[8px] border border-grey-4 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-1 min-h-[100px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="editStart">Start Date</Label>
            <Input id="editStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEnd">End Date</Label>
            <Input id="editEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="editTarget">Target Value</Label>
          <Input id="editTarget" type="number" min="0" step="any" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="editTrackingMethod">How progress is tracked</Label>
          <select
            id="editTrackingMethod"
            value={trackingMethod}
            onChange={(e) => setTrackingMethod(e.target.value as ChallengeTrackingMethod)}
            className="w-full h-10 rounded-[8px] border border-grey-4 bg-white px-3 text-sm"
          >
            <option value="automatic">Automatic — phone or wearable health data</option>
            <option value="self_reported">Self-reported — mark the activity complete</option>
            <option value="evidence_based">Evidence-based — photo and optional notes</option>
            <option value="platform_recorded">Platform recorded — event, club or in-app activity</option>
          </select>
        </div>

        {showActivityLabel && (
          <div className="space-y-2">
            <Label htmlFor="editActivityLabel">Activity</Label>
            <Input
              id="editActivityLabel"
              placeholder="e.g. Prepare a healthy meal containing vegetables"
              value={activityLabel}
              onChange={(e) => setActivityLabel(e.target.value)}
            />
          </div>
        )}

        {isEvidenceBased && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BooleanRadio label="Evidence required" value={evidenceRequired} onChange={(value) => { setEvidenceRequired(value); }} />
            <BooleanRadio label="Requires admin approval" value={requiresApproval} onChange={(value) => { setRequiresApproval(value); }} />
          </div>
        )}
      </form>
    </Modal>
  );
}
