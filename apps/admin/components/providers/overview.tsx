"use client";

import { createContext, useContext, type ReactNode } from "react";
import { adminApi } from "@/services/admin-api";
import { useResource, type Resource } from "@/lib/use-resource";
import type { PlatformOverview } from "@/types/admin";

const OverviewContext = createContext<Resource<PlatformOverview> | null>(null);

/** Platform totals, loaded once and shared by the sidebar badges and page headers. */
export function OverviewProvider({ children }: { children: ReactNode }) {
  const overview = useResource((signal) => adminApi.overview({ signal }), []);
  return <OverviewContext.Provider value={overview}>{children}</OverviewContext.Provider>;
}

export function useOverview(): Resource<PlatformOverview> {
  const overview = useContext(OverviewContext);
  if (!overview) throw new Error("useOverview must be used inside OverviewProvider");
  return overview;
}
