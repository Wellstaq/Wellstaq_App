import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="admin-page-header flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-sans text-[26px] font-semibold leading-8 tracking-[-0.02em] text-grey-1 sm:text-[28px] sm:leading-9">{title}</h1>
        {description && <p className="mt-2 max-w-[70ch] text-[15px] leading-6 text-grey-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
