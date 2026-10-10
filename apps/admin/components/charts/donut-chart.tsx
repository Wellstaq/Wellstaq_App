"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import { formatNumber } from "@/lib/format";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  const share = (value / total) * 100;
  return `${share > 0 && share < 1 ? "<1" : Math.round(share)}%`;
}

function SliceTooltip({ active, payload, total }: TooltipProps<number, string> & { total: number }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload as DonutSlice;
  return (
    <div className="rounded-[10px] border border-line bg-white px-3 py-2 shadow-[0_8px_24px_-12px_rgba(26,26,26,0.25)]">
      <p className="flex items-center gap-2 text-xs text-grey-2">
        <span className="h-2 w-2 rounded-full" style={{ background: slice.color }} aria-hidden="true" />
        {slice.label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-grey-1">
        {formatNumber(slice.value)} <span className="font-normal text-grey-3">({percent(slice.value, total)})</span>
      </p>
    </div>
  );
}

/** Donut with the total in the middle and a legend carrying every value, so color is never the only cue. */
export function DonutChart({ slices, centerLabel, ariaLabel }: { slices: DonutSlice[]; centerLabel: string; ariaLabel: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const isEmpty = total === 0;
  const data = isEmpty ? [{ label: "None", value: 1, color: "#EFEFEF" }] : slices.filter((slice) => slice.value > 0);

  return (
    <div className="flex flex-col items-center gap-6 px-5 pb-5 sm:flex-row sm:items-center xl:flex-col 2xl:flex-row">
      <div className="relative h-[196px] w-[196px] shrink-0" role="img" aria-label={`${ariaLabel}: ${slices.map((slice) => `${slice.label} ${formatNumber(slice.value)}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={68}
              outerRadius={92}
              paddingAngle={data.length > 1 ? 1.5 : 0}
              cornerRadius={3}
              startAngle={90}
              endAngle={-270}
              stroke="#FFFFFF"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((slice) => <Cell key={slice.label} fill={slice.color} />)}
            </Pie>
            {!isEmpty && <Tooltip content={<SliceTooltip total={total} />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[24px] font-semibold leading-7 tabular-nums text-grey-1">{formatNumber(total)}</p>
          <p className="text-[13px] text-grey-3">{centerLabel}</p>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-3">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[15px] text-grey-1">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: slice.color }} aria-hidden="true" />
                <span>{slice.label}</span>
              </p>
              <p className="ml-[18px] text-[13px] tabular-nums text-grey-3">{formatNumber(slice.value)}</p>
            </div>
            <p className="text-[15px] tabular-nums text-grey-1">{percent(slice.value, total)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
