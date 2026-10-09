import type { ReactNode } from "react";
import { cn } from "@wellstaq/ui/utils";

/** Same anatomy as the org dashboard StatCard. */
export function StatTile({ title, value, detail, icon, iconClassName }: { title: string; value: string; detail?: string; icon: ReactNode; iconClassName: string }) {
  return (
    <div className="dashboard-card">
      <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-xl sm:mb-4 sm:h-10 sm:w-10", iconClassName)} aria-hidden="true">
        {icon}
      </div>
      <p className="mb-1 truncate text-xs font-medium text-grey-2 sm:text-sm">{title}</p>
      <p className="mb-1 font-display text-xl font-bold text-grey-1">{value}</p>
      {detail && <p className="truncate text-xs text-grey-2">{detail}</p>}
    </div>
  );
}
