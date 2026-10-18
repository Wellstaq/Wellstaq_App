"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  LockKeyhole,
  RefreshCw,
} from "@wellstaq/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/components/providers/dashboard-data-provider";
import { getUserErrorMessage } from "@/lib/errors";
import { hasOrgWidePermission } from "@/lib/permissions";
import { api } from "@/services/api";
import type { WellbeingSurveyCadence } from "@/types/api";

interface CadenceOption {
  value: WellbeingSurveyCadence;
  label: string;
  interval: string;
  description: string;
}

const CADENCE_OPTIONS: CadenceOption[] = [
  {
    value: "weekly",
    label: "Weekly",
    interval: "Every 7 days",
    description: "Keep a close view of fast-moving workload and team wellbeing changes.",
  },
  {
    value: "biweekly",
    label: "Every two weeks",
    interval: "Every 14 days",
    description: "Balance regular feedback with more time for teams to respond to each pulse.",
  },
  {
    value: "monthly",
    label: "Monthly",
    interval: "Every 30 days",
    description: "Use a lighter rhythm for a broader month-to-month wellbeing view.",
  },
];

const DEFAULT_CADENCE: WellbeingSurveyCadence = "monthly";

function CadenceLoadingState() {
  return (
    <div className="max-w-3xl" aria-label="Loading cadence settings">
      <div className="dashboard-card p-5 sm:p-6">
        <div className="h-5 w-44 animate-pulse rounded bg-grey-4" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-grey-5" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[110px] animate-pulse rounded-[10px] bg-grey-5" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function WellbeingPulseCadenceSettings({ embedded = false }: { embedded?: boolean }) {
  const { currentUser, organizationId, isLoading: isDashboardLoading, error: dashboardError, refresh } = useDashboardData();
  const [selectedCadence, setSelectedCadence] = useState<WellbeingSurveyCadence>(DEFAULT_CADENCE);
  const [savedCadence, setSavedCadence] = useState<WellbeingSurveyCadence | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (isConfirmOpen && !dialog.open) dialog.showModal();
    if (!isConfirmOpen && dialog.open) dialog.close();
  }, [isConfirmOpen]);

  const canManageCadence = currentUser
    ? hasOrgWidePermission(currentUser.permissions, "org.settings.update")
    : false;

  const loadConfig = useCallback(async () => {
    if (!organizationId || !canManageCadence) return;
    setIsLoading(true);
    setError(null);
    try {
      const config = await api.organization.getWellbeingSurveyConfig(organizationId);
      const cadence = config?.cadence ?? DEFAULT_CADENCE;
      setSelectedCadence(cadence);
      setSavedCadence(config?.cadence ?? null);
      setIsActive(config?.isActive ?? false);
    } catch (reason) {
      setError(getUserErrorMessage(reason, "We couldn't load the wellbeing pulse cadence. Try again."));
    } finally {
      setIsLoading(false);
    }
  }, [canManageCadence, organizationId]);

  useEffect(() => {
    if (isDashboardLoading) return;
    if (!organizationId || !canManageCadence) {
      setIsLoading(false);
      return;
    }
    void loadConfig();
  }, [canManageCadence, isDashboardLoading, loadConfig, organizationId]);

  const handleSave = async () => {
    if (isSaving) return;
    if (!organizationId || !canManageCadence) {
      setSaveError("Your organization is unavailable. Refresh the page and sign in if needed.");
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      const config = await api.organization.updateWellbeingSurveyCadence(organizationId, selectedCadence);
      setSelectedCadence(config.cadence);
      setSavedCadence(config.cadence);
      setIsActive(config.isActive);
      setIsConfirmOpen(false);
      toast.success("Wellbeing pulse cadence updated.");
    } catch (reason) {
      setSaveError(getUserErrorMessage(reason, "We couldn't save the wellbeing pulse cadence. Try again."));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isDashboardLoading && !currentUser) {
    return (
      <div className="dashboard-card max-w-xl p-7 text-center" role="alert">
        <h2 className="text-lg font-bold text-grey-1">Account unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-grey-2">{dashboardError ?? "Sign in to manage your organization’s wellbeing pulse cadence."}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="outline" onClick={() => void refresh()}>Try again</Button>
          <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-[12px] bg-primary-1 px-6 text-sm font-medium text-white hover:bg-primary-hover">Sign in</Link>
        </div>
      </div>
    );
  }

  if (!isDashboardLoading && currentUser && !canManageCadence) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-12">
        <div className="dashboard-card w-full p-7 text-center sm:p-8" role="alert">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-5 text-primary-1">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-grey-1">Organization permission required</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-grey-2">
            Only admins with organization-wide permission to update settings can change the wellbeing pulse cadence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 pb-12">
      <header>
        {embedded
          ? <h2 className="text-[18px] font-bold leading-8 text-grey-1">Wellbeing pulse cadence</h2>
          : <h1 className="page-title">Wellbeing pulse cadence</h1>}
        <p className="page-description">Choose how often people in your organization are prompted to share a wellbeing pulse.</p>
      </header>

      {isLoading || isDashboardLoading ? (
        <CadenceLoadingState />
      ) : error ? (
        <div className="dashboard-card flex min-h-64 flex-col items-center justify-center p-8 text-center" role="alert">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-base font-bold text-grey-1">We couldn&apos;t load the cadence</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-grey-2">{error}</p>
          <Button type="button" variant="outline" className="mt-5" onClick={() => void loadConfig()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="max-w-3xl">
          <section className="dashboard-card p-5 sm:p-6" aria-labelledby="cadence-heading">
            <div className="flex flex-col gap-3 border-b border-grey-4 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="cadence-heading" className="text-base font-bold text-grey-1">Prompt frequency</h2>
                <p className="mt-1 text-sm leading-6 text-grey-2">Select one cadence for everyone in the organization.</p>
              </div>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-green-50 text-green-700" : "bg-grey-5 text-grey-2"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-600" : "bg-grey-3"}`} aria-hidden="true" />
                {savedCadence ? (isActive ? "Active" : "Inactive") : "Not configured"}
              </span>
            </div>

            <fieldset className="mt-5">
              <legend className="sr-only">Wellbeing pulse cadence</legend>
              <div className="space-y-3">
                {CADENCE_OPTIONS.map((option) => {
                  const isSelected = selectedCadence === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex min-h-24 cursor-pointer items-start gap-4 rounded-[10px] border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary-1 focus-within:ring-offset-2 ${isSelected ? "border-primary-1 bg-primary-5" : "border-grey-4 bg-white hover:border-primary-2"}`}
                    >
                      <input
                        type="radio"
                        name="wellbeing-pulse-cadence"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => setSelectedCadence(option.value)}
                        className="sr-only"
                      />
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-primary-1 bg-primary-1 text-white" : "border-grey-3 bg-white"}`} aria-hidden="true">
                        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <span className="text-sm font-bold text-grey-1">{option.label}</span>
                          <span className="text-xs font-semibold text-grey-2">{option.interval}</span>
                        </span>
                        <span className="mt-1.5 block text-sm leading-6 text-grey-2">{option.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex justify-end border-t border-grey-4 pt-5">
              <Button
                type="button"
                onClick={() => { setSaveError(null); setIsConfirmOpen(true); }}
                disabled={isSaving || selectedCadence === savedCadence}
                className="w-full sm:w-auto"
              >
                Save changes
              </Button>
            </div>
          </section>
        </div>
      )}

      <dialog
        ref={confirmDialogRef}
        aria-labelledby="confirm-cadence-heading"
        aria-describedby="confirm-cadence-description"
        onCancel={(event) => {
          event.preventDefault();
          if (!isSaving) setIsConfirmOpen(false);
        }}
        className="fixed inset-auto left-1/2 top-1/2 m-0 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-grey-4 bg-white p-0 text-grey-1 shadow-xl backdrop:bg-black/50"
      >
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-5 text-primary-1">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 id="confirm-cadence-heading" className="mt-4 text-center text-lg font-bold">Confirm wellbeing pulse cadence</h2>
          <p id="confirm-cadence-description" className="mt-2 text-center text-sm leading-6 text-grey-2">
            {`Set prompts to ${CADENCE_OPTIONS.find((option) => option.value === selectedCadence)?.label.toLowerCase()}? This controls when each new wellbeing pulse begins.`}
          </p>
          <p className="mt-4 text-center text-xs leading-5 text-grey-2">Changing the cadence schedules future pulse windows. Any pulse that is already open continues as planned.</p>
          {saveError && <p role="alert" className="mt-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button type="button" disabled={isSaving} aria-busy={isSaving} onClick={() => void handleSave()}>
              {isSaving ? "Saving..." : "Confirm and save"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
