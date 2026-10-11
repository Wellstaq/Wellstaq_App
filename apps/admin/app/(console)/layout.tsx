"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@wellstaq/ui/utils";
import { AdminSessionProvider } from "@/components/providers/admin-session";
import { OverviewProvider } from "@/components/providers/overview";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setIsSidebarOpen(false), [pathname]);

  return (
    <AdminSessionProvider>
      <OverviewProvider>
      <div className="fixed inset-x-0 top-0 flex h-dvh overflow-hidden bg-grey-5">
        {isSidebarOpen && <div className="fixed inset-0 z-40 bg-grey-1/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />}
        <div className={cn("fixed z-50 transition-transform duration-300 lg:relative lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
        <div className="flex w-full min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
          <main id="main" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-6 px-4 py-3 sm:px-5">{children}</div>
          </main>
        </div>
      </div>
      </OverviewProvider>
    </AdminSessionProvider>
  );
}
