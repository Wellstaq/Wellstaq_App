"use client";

import { ChevronLeft, ChevronRight } from "@wellstaq/ui/icons";
import { formatNumber } from "@/lib/format";

function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

const navButton = "flex h-10 items-center justify-center gap-1 rounded-[8px] bg-grey-5 px-3 text-sm text-grey-1 transition-colors hover:bg-grey-4 disabled:cursor-not-allowed disabled:opacity-50";

export function Pagination({
  page,
  pageSize,
  total,
  noun,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label={`${noun} pages`} className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-line pt-4 sm:flex-row">
      <p className="text-sm text-grey-2">
        Showing {formatNumber(from)}-{formatNumber(to)} of {formatNumber(total)} {noun}
      </p>
      <div className="flex items-center gap-1.5">
        <button type="button" className={navButton} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="w-6 text-center text-sm text-grey-3" aria-hidden="true">...</span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onPageChange(item)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-[8px] px-2 text-sm font-medium transition-colors ${item === page ? "bg-primary-hover text-white" : "text-grey-2 hover:bg-grey-5"}`}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <button type="button" className={navButton} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
