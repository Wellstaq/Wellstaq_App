"use client";

import { createContext, useContext, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { adminApi } from "@/services/admin-api";
import { useResource } from "@/lib/use-resource";
import { ErrorPanel } from "@/components/ui/states";
import type { AdminMe } from "@/types/admin";

interface AdminSessionValue {
  admin: AdminMe;
  /** Updates the session in place after e.g. a profile edit, so the
   * sidebar/top-bar avatar and name refresh everywhere without a reload. */
  setAdmin: (admin: AdminMe) => void;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

/** Loads the signed-in admin once for the whole console. A 401 redirects to login inside the HTTP client. */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const session = useResource((signal) => adminApi.auth.me({ signal }), []);

  if (session.isLoading && !session.data) {
    return (
      <div className="flex h-dvh items-center justify-center gap-2 text-sm text-grey-2" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Checking your session...
      </div>
    );
  }
  if (session.error || !session.data) {
    return (
      <div className="flex h-dvh items-center justify-center">
        {session.error && <ErrorPanel error={session.error} onRetry={session.reload} />}
      </div>
    );
  }
  const value: AdminSessionValue = { admin: session.data, setAdmin: (admin) => session.setData(() => admin) };
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdmin(): AdminMe {
  const context = useContext(AdminSessionContext);
  if (!context) throw new Error("useAdmin must be used inside AdminSessionProvider");
  return context.admin;
}

/** Like useAdmin(), but also returns a setter for updating the session
 * after a self-service profile edit — see Settings page. */
export function useAdminSession(): AdminSessionValue {
  const context = useContext(AdminSessionContext);
  if (!context) throw new Error("useAdminSession must be used inside AdminSessionProvider");
  return context;
}
