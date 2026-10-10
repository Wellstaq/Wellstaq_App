"use client";

import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { SelectablePill } from "@wellstaq/ui/selectable-pill";
import { formatNumber } from "@/lib/format";
import type { SignupTrendPoint } from "@/types/admin";

const SERIES = [
  { key: "individuals", label: "Individual users" },
  { key: "employees", label: "Employees" },
  { key: "organizations", label: "Organizations" },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

const BRAND = "#EA6A05";
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long" });
const compact = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });
const asDate = (value: string) => new Date(`${value}T00:00:00`);

function ChartTooltip({ active, payload, label, seriesLabel }: TooltipProps<number, string> & { seriesLabel: string }) {
  if (!active || !payload?.length || typeof label !== "string") return null;
  return (
    <div className="rounded-[10px] border border-line bg-white px-3 py-2 shadow-[0_8px_24px_-12px_rgba(26,26,26,0.25)]">
      <p className="text-xs text-grey-3">{longDate.format(asDate(label))}</p>
      <p className="mt-0.5 flex items-center gap-2 text-sm text-grey-1">
        <span className="h-2 w-2 rounded-full bg-primary-1" aria-hidden="true" />
        <span className="font-semibold tabular-nums">{formatNumber(Number(payload[0].value))}</span>
        <span className="text-grey-2">{seriesLabel.toLowerCase()}</span>
      </p>
    </div>
  );
}

export function SignupChart({ points }: { points: SignupTrendPoint[] | undefined }) {
  const gradientId = useId().replace(/:/g, "");
  const [series, setSeries] = useState<SeriesKey>("individuals");
  const current = SERIES.find((item) => item.key === series)!;
  const data = points ?? [];
  const total = (days: number) => data.slice(-days).reduce((sum, point) => sum + (point[series] ?? 0), 0);
  const hasData = data.length > 0;

  return (
    <div className="flex h-full flex-col gap-4 px-5 pb-5">
      <div role="group" aria-label="Choose what to plot" className="-mt-1 flex flex-wrap gap-1">
        {SERIES.map((item) => (
          <SelectablePill key={item.key} appearance="plain" selected={series === item.key} onClick={() => setSeries(item.key)} className="h-10 px-2.5 text-[13px]">
            {item.label}
          </SelectablePill>
        ))}
      </div>

      <div className="relative h-[220px] rounded-[14px] border border-line bg-white">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EFEFEF" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{ fill: "#999999", fontSize: 12 }}
                tickFormatter={(value: string) => shortDate.format(asDate(value))}
              />
              <YAxis width={40} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#999999", fontSize: 12 }} tickFormatter={(value: number) => compact.format(value)} />
              <Tooltip cursor={{ stroke: "#CFCFCF", strokeWidth: 1 }} content={<ChartTooltip seriesLabel={current.label} />} />
              <Area
                type="monotone"
                dataKey={series}
                stroke={BRAND}
                strokeWidth={2}
                strokeLinecap="round"
                fill={`url(#${gradientId})`}
                activeDot={{ r: 5, fill: BRAND, stroke: "#FFFFFF", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <LineChartIcon className="h-6 w-6 text-grey-3" strokeWidth={1.6} aria-hidden="true" />
            <p className="text-sm font-medium text-grey-1">No sign-ups to chart yet</p>
            <p className="max-w-[260px] text-xs leading-5 text-grey-3">Daily sign-ups for the last 30 days will appear here.</p>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {[
          { label: "Last 7 days", value: total(7) },
          { label: "Last 30 days", value: total(30) },
        ].map((item) => (
          <div key={item.label} className="rounded-[12px] border border-line px-4 py-3">
            <dt className="text-[13px] text-grey-3">{item.label}</dt>
            <dd className="mt-1 text-lg tabular-nums text-grey-1">{hasData ? formatNumber(item.value) : "0"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
