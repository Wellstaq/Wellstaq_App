import type { ReactNode } from "react";
import type { IconComponent } from "@wellstaq/ui/icons";
import { Skeleton } from "@wellstaq/ui/skeleton";
import { cn } from "@wellstaq/ui/utils";

export type MetricTone = "positive" | "negative" | "neutral" | "brand";

const TONE_TEXT: Record<MetricTone, string> = {
  positive: "text-success-1",
  negative: "text-error-1",
  neutral: "text-grey-3",
  brand: "text-primary-hover",
};

interface MetricCardProps {
  icon: IconComponent;
  label: string;
  value: string | null;
  /** Small line under the value, e.g. "+246 this week". */
  footnote?: ReactNode;
  footnoteTone?: MetricTone;
  /** Content aligned to the right of the value, e.g. a trend or a link. */
  aside?: ReactNode;
  className?: string;
}

/** Quiet KPI card: icon and label on one line, a regular-weight value, one supporting line. */
export function MetricCard({ icon: Icon, label, value, footnote, footnoteTone = "neutral", aside, className }: MetricCardProps) {
  return (
    <div className={cn("admin-metric relative flex min-w-0 min-h-[152px] flex-col rounded-[16px] border border-line bg-white p-4 sm:min-h-[164px] sm:p-5", className)}>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-line bg-grey-5 text-grey-2" aria-hidden="true">
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </span>
        <p className="truncate text-xs font-medium text-grey-2 sm:text-[13px]">{label}</p>
      </div>
      <div className="mt-auto pt-4">
        {value === null ? (
          <>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <p className="text-[28px] font-semibold sm:text-[32px] leading-10 tracking-[-0.04em] text-grey-1 tabular-nums">{value}</p>
              {aside && <div className="pb-0.5 text-[13px]">{aside}</div>}
            </div>
            {footnote && <p className={cn("mt-1 text-xs leading-5", TONE_TEXT[footnoteTone])}>{footnote}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export function MetricGrid({ children, columns = 5 }: { children: ReactNode; columns?: 3 | 4 | 5 }) {
  const cols = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-3 xl:grid-cols-5" }[columns];
  return <div className={cn("grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4", cols)}>{children}</div>;
}
