import { cn } from "@wellstaq/ui/utils";
import { humanize } from "@/lib/format";

type Tone = "positive" | "attention" | "brand" | "critical" | "neutral";

const TONES: Record<Tone, string> = {
  positive: "border-secondary-3 bg-secondary-4 text-success-1",
  attention: "border-info-3 bg-info-4 text-warning-text",
  brand: "border-primary-border bg-primary-5 text-warning-text",
  critical: "border-error-4 bg-error-5 text-error-1",
  neutral: "border-grey-4 bg-grey-5 text-grey-2",
};

const STATUS_TONES: Record<string, Tone> = {
  active: "positive",
  ongoing: "positive",
  resolved: "positive",
  scheduled: "brand",
  in_progress: "brand",
  invited: "attention",
  open: "attention",
  pending_setup: "attention",
  pending_verification: "attention",
  suspended: "critical",
  cancelled: "neutral",
  completed: "neutral",
  closed: "neutral",
  disabled: "neutral",
  deactivated: "neutral",
};

const LABELS: Record<string, string> = {
  scheduled: "Upcoming",
  pending_setup: "Setting up",
  pending_verification: "Unverified",
  in_progress: "In progress",
  cancelled: "Canceled",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONES[status] ?? "neutral";
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-xs font-medium leading-5", TONES[tone], className)}>
      {LABELS[status] ?? humanize(status, "Unknown")}
    </span>
  );
}
