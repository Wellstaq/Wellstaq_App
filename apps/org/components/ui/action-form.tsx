"use client";

import { useRef, type ComponentProps } from "react";

interface ActionFormProps extends Omit<ComponentProps<"form">, "onSubmit" | "action"> {
  onAction: () => void | Promise<unknown>;
  canSubmit: boolean;
  pending?: boolean;
}

/** One primary action for both a click and the browser's implicit Enter submit. */
export function ActionForm({ onAction, canSubmit, pending = false, onKeyDown, ...props }: ActionFormProps) {
  const submitting = useRef(false);

  return (
    <form
      {...props}
      noValidate
      aria-busy={pending}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        const target = event.target as HTMLElement;
        // Keep multiline editing and dropdown/selection key handling intact.
        if (!event.defaultPrevented && event.key === "Enter" && !target.closest('textarea, [contenteditable="true"]') && (event.nativeEvent.isComposing || event.repeat)) {
          event.preventDefault();
        }
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSubmit || pending || submitting.current) return;
        submitting.current = true;
        try {
          await onAction();
        } finally {
          submitting.current = false;
        }
      }}
    />
  );
}
