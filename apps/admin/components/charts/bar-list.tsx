import { formatNumber } from "@/lib/format";

export interface BarListItem {
  label: string;
  value: number;
  detail?: string;
}

/** Horizontal bars for comparing a few magnitudes. Every bar carries its value, so color only reinforces length. */
export function BarList({ items, ariaLabel }: { items: BarListItem[]; ariaLabel: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul aria-label={ariaLabel} className="space-y-4 px-5 pb-5">
      {items.map((item) => {
        const width = item.value === 0 ? 0 : Math.max(2, (item.value / max) * 100);
        return (
          <li key={item.label} className="grid grid-cols-[minmax(96px,140px)_1fr] items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-[15px] text-grey-1">{item.label}</p>
              {item.detail && <p className="truncate text-xs text-grey-3">{item.detail}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 min-w-0 flex-1">
                <div className="h-full rounded-r-[4px] bg-primary-1/85" style={{ width: `${width}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right text-sm tabular-nums text-grey-1">{formatNumber(item.value)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
