"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { CommandSearch } from "@/components/shell/command-search";
import { adminApi } from "@/services/admin-api";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [today] = useState(() => dateFormatter.format(new Date()));

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await adminApi.auth.logout();
    } catch {
      // The proxy clears the session cookies even when the backend call fails.
    }
    window.location.assign("/login?reason=signed_out");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-4 border-b border-line bg-white px-4 lg:px-5">
      <button type="button" onClick={onMenuClick} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-[10px] text-grey-2 hover:bg-grey-5 lg:hidden">
        <Menu className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
      </button>
      <p className="hidden min-w-0 shrink-0 truncate text-[15px] font-medium text-grey-1 xl:block" suppressHydrationWarning>{today}</p>
      <div className="flex flex-1 justify-end md:justify-center">
        <CommandSearch />
      </div>
      <button
        type="button"
        onClick={signOut}
        disabled={isSigningOut}
        className="flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-3 text-[15px] font-medium text-error-1 transition-colors hover:bg-error-5 disabled:opacity-60"
      >
        <LogOut className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
        <span className="hidden sm:inline">{isSigningOut ? "Logging out..." : "Log out"}</span>
      </button>
    </header>
  );
}
