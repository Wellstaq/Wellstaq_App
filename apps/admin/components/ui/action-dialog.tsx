"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@wellstaq/ui/modal";
import { Button } from "@wellstaq/ui/button";
import { Label } from "@wellstaq/ui/label";
import { dangerButton, primaryButton, secondaryButton } from "@/components/ui/button-styles";

export interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  /** When set, the admin must explain the action. The reason is stored in the audit log. */
  reasonLabel?: string;
  onConfirm: (reason: string) => Promise<unknown>;
}

const MIN_REASON_LENGTH = 10;

export function ActionDialog({ isOpen, onClose, title, description, confirmLabel, pendingLabel, destructive, reasonLabel, onConfirm }: ActionDialogProps) {
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
      setIsPending(false);
    }
  }, [isOpen]);

  const needsReason = Boolean(reasonLabel);
  const trimmed = reason.trim();
  const canConfirm = !isPending && (!needsReason || trimmed.length >= MIN_REASON_LENGTH);

  const confirm = async () => {
    if (!canConfirm) return;
    setIsPending(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : "We couldn't complete this action. Try again.");
      setIsPending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isPending && onClose()}
      title={title}
      size="compact"
      footer={
        <>
          <Button type="button" size="sm" className={secondaryButton} onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="button" size="sm" className={destructive ? dangerButton : primaryButton} onClick={confirm} disabled={!canConfirm} aria-busy={isPending}>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-grey-2">{description}</p>
      {needsReason && (
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor={reasonId} className="text-sm font-medium text-grey-1">{reasonLabel}</Label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={3}
            aria-describedby={`${reasonId}-help`}
            className="w-full resize-none rounded-[8px] border border-line bg-white p-3 text-sm text-grey-1 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
          />
          <p id={`${reasonId}-help`} className="text-xs text-grey-2">
            Saved to the audit log. At least {MIN_REASON_LENGTH} characters.
          </p>
        </div>
      )}
      {error && <p role="alert" className="mt-4 rounded-[8px] border border-error-4 bg-error-5 px-3 py-2 text-sm text-error-1">{error}</p>}
    </Modal>
  );
}
