// path: components/challenges/submission-review-panel.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { api } from "@/services/api";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChallengeSubmission } from "@/types/api";

const STATUS_TABS: { label: string; value: "pending" | "approved" | "rejected" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export function SubmissionReviewPanel({
  organizationId,
  challengeId,
  canReview,
}: {
  organizationId: string;
  challengeId: string;
  canReview: boolean;
}) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<ChallengeSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await api.organization.getChallengeSubmissions(organizationId, challengeId, { status, limit: 50 });
      setSubmissions(res.items);
      setTotal(res.total);
    } catch {
      setSubmissions([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, challengeId, status]);

  const handleApprove = async (submission: ChallengeSubmission) => {
    try {
      await api.organization.reviewChallengeSubmission(organizationId, challengeId, submission.id, { action: "approve" });
      toast.success("Submission approved");
      await load();
    } catch {
      // error toast handled globally
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting this submission.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.organization.reviewChallengeSubmission(organizationId, challengeId, rejectTarget.id, {
        action: "reject",
        reason: rejectionReason.trim(),
      });
      toast.success("Submission rejected");
      setRejectTarget(null);
      setRejectionReason("");
      await load();
    } catch {
      // error toast handled globally
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="bg-white rounded-[12px] border border-grey-4 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-bold text-grey-1">Submission Review ({total})</h2>
        <div className="flex items-center gap-1">
          {STATUS_TABS.map((tab) => (
            <SelectablePill key={tab.value} onClick={() => setStatus(tab.value)} selected={status === tab.value} appearance="plain">
              {tab.label}
            </SelectablePill>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 bg-grey-5 rounded-xl animate-pulse" />)}
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-grey-3 italic py-6 text-center">No {status} submissions.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div key={submission.id} className="flex flex-col sm:flex-row gap-4 p-3 rounded-xl border border-grey-4">
              {submission.photoUrl && (
                <div className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-grey-4">
                  <Image src={submission.photoUrl} alt="Submission evidence" fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-grey-1">{submission.firstName} {submission.lastName}</p>
                  <span className="text-xs text-grey-3">{new Date(submission.entryDate).toLocaleDateString()}</span>
                </div>
                {submission.note && <p className="text-sm text-grey-2">{submission.note}</p>}
                {submission.reviewStatus === "rejected" && submission.rejectionReason && (
                  <p className="text-xs text-red-600">Rejected: {submission.rejectionReason}</p>
                )}
                {canReview && status === "pending" && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button type="button" onClick={() => handleApprove(submission)} className="h-9 px-3">
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 px-3 border-grey-4 bg-white text-red-600 hover:bg-red-50"
                      onClick={() => { setRejectTarget(submission); setRejectionReason(""); }}
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Submission"
        subtitle="The participant will be notified with this reason."
        size="compact"
        footer={
          <>
            <Button type="button" variant="outline" className="border-grey-4 bg-white text-grey-2 hover:bg-grey-5" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleRejectSubmit} disabled={isSubmittingReview || !rejectionReason.trim()}>
              {isSubmittingReview ? "Rejecting..." : "Reject Submission"}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Input
            placeholder="Reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
