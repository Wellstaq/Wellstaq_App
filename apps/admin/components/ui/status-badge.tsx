import { cn } from "@wellstaq/ui/utils";
import { humanize } from "@/lib/format";

type Tone = "positive" | "attention" | "info" | "critical" | "neutral";

const TONES: Record<Tone, string> = {
  positive: "bg-[#EAF7EC] text-[#1C7A2E]",
  attention: "bg-[#FFF3E5] text-warning-text",
  info: "bg-[#EAF1FB] text-[#2459A6]",
  critical: "bg-[#FDECEA] text-error-1",
  neutral: "bg-grey-5 text-grey-2 ring-1 ring-inset ring-line",
};

const STATUS_TONES: Record<string, Tone> = {
  active: "positive",
  ongoing: "positive",
  resolved: "positive",
  scheduled: "info",
  in_progress: "info",
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
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-[6px] px-2 py-[3px] text-xs font-semibold leading-4", TONES[tone], className)}>
      {LABELS[status] ?? humanize(status, "Unknown")}
    </span>
  );
}
