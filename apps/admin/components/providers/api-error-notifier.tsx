"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ApiErrorNotifier() {
  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; status: number; code?: string }>).detail;
      const message = detail?.message?.trim() || "Something went wrong. Try again.";
      toast.error(message, { id: `admin-api-error:${detail?.status}:${detail?.code ?? message}` });
    };
    window.addEventListener("wellstaq-admin:api-error", handle);
    return () => window.removeEventListener("wellstaq-admin:api-error", handle);
  }, []);
  return null;
}
