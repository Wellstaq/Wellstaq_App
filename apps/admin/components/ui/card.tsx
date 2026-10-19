import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "@wellstaq/ui/icons";
import { cn } from "@wellstaq/ui/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section {...props} className={cn("admin-card min-w-0 rounded-[16px] border border-line bg-white", className)}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action, id, className }: { title: string; subtitle?: string; action?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="min-w-0">
        <h2 id={id} className="font-sans text-[16px] font-semibold leading-6 tracking-[-0.015em] text-grey-1">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] leading-5 text-grey-2">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function ViewAllLink({ href, children = "View all" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex min-h-9 items-center justify-start gap-2 rounded-lg px-2 text-sm font-medium text-primary-hover hover:text-[#A84A00]">
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden="true" />
    </Link>
  );
}
