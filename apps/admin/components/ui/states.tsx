"use client";

import type { ReactNode } from "react";
import type { IconComponent } from "@wellstaq/ui/icons";
import { AlertCircle, Lock, RefreshCw, SearchX } from "@wellstaq/ui/icons";
import { Button } from "@/components/ui/controls";
import { cn } from "@wellstaq/ui/utils";
import { secondaryButton } from "@/components/ui/button-styles";
import type { ApiError } from "@/services/http";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <span className="empty-state-icon mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-grey-5" aria-hidden="true">
        <Icon className="h-7 w-7" strokeWidth={1.7} />
      </span>
      <p className="text-base font-semibold text-grey-1">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-grey-2">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Shown when a list is empty because of the current search or filters. */
export function NoResults({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No matches"
      description="Nothing matches your search or filters. Try different terms or clear the filters."
      action={onClear && <Button type="button" size="sm" className={secondaryButton} onClick={onClear}>Clear filters</Button>}
    />
  );
}

function describe(error: ApiError): { icon: IconComponent; title: string; message: string } {
  if (error.status === 403) {
    return { icon: Lock, title: "You don't have access", message: "Your admin role doesn't include this section. Ask a super admin if you need it." };
  }
  if (error.status === 404) {
    return { icon: SearchX, title: "Nothing to show", message: "This record doesn't exist or may have been removed." };
  }
  return { icon: AlertCircle, title: "We couldn't load this", message: "Something went wrong while loading. Try again in a moment." };
}

export function ErrorPanel({ error, onRetry, className }: { error: ApiError; onRetry?: () => void; className?: string }) {
  const { icon: Icon, title, message } = describe(error);
  const canRetry = onRetry && error.status !== 403;
  return (
    <div role="alert" className={cn("flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-error-5 text-error-1" aria-hidden="true">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <p className="text-base font-semibold text-grey-1">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-grey-2">{message}</p>
      {canRetry && (
        <Button type="button" size="sm" onClick={onRetry} className={cn(secondaryButton, "mt-6")}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
