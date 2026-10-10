"use client";

import { createContext, useContext, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { adminApi } from "@/services/admin-api";
import { useResource } from "@/lib/use-resource";
import { ErrorPanel } from "@/components/ui/states";
import type { AdminMe } from "@/types/admin";

const AdminSessionContext = createContext<AdminMe | null>(null);

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
  return <AdminSessionContext.Provider value={session.data}>{children}</AdminSessionContext.Provider>;
}

export function useAdmin(): AdminMe {
  const admin = useContext(AdminSessionContext);
  if (!admin) throw new Error("useAdmin must be used inside AdminSessionProvider");
  return admin;
}
