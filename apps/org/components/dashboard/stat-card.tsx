import Link from "next/link";
import type { ReactNode } from "react";
import type { StatTrend } from "@/types/api";
import { TrendBadge } from "@/components/dashboard/trend-badge";

type StatCardProps = {
  title: string;
  href?: string;
  onClick?: () => void;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconClassName: string;
  trend?: StatTrend | null;
};

export function StatCard({ title, value, subtitle, icon, iconClassName, trend, href, onClick }: StatCardProps) {
  const content = (
    <div className="dashboard-card h-full border border-grey-4">
      <div className="flex items-start justify-between mb-2 sm:mb-4">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${iconClassName}`}>
          {icon}
        </div>
        {trend !== undefined && <TrendBadge trend={trend} />}
      </div>
      <p className="text-[10px] sm:text-sm text-[#4D4D4D] mb-1 font-medium truncate">{title}</p>
      <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">{value}</h3>
      {subtitle && <p className="text-[10px] text-grey-3 truncate">{subtitle}</p>}
    </div>
  );
  if (href) return <Link href={href} className="block h-full rounded-xl transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary-1">{content}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="block h-full w-full rounded-xl text-left transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary-1">{content}</button>;
  return content;
}
