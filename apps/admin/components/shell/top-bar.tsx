"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, PlugZap } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAdmin } from "@/components/providers/admin-session";
import { adminApi } from "@/services/admin-api";
import { fullName } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const admin = useAdmin();
  const name = fullName(admin);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

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
    <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-grey-4 bg-white px-4 lg:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onMenuClick} aria-label="Open menu" className="rounded-lg p-2 text-grey-2 hover:bg-grey-5 lg:hidden">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        {admin.isPreview && (
          <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-info-3 bg-info-4 px-2.5 py-1 text-xs font-medium text-warning-text">
            <PlugZap className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Preview mode: no backend connected</span>
            <span className="sm:hidden">Preview mode</span>
          </span>
        )}
      </div>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 text-left hover:bg-grey-5"
        >
          <Avatar name={name} src={admin.avatarUrl} size={36} />
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-[180px] truncate text-sm font-semibold text-grey-1">{name}</span>
            <span className="block text-xs text-grey-2">{ROLE_LABELS[admin.role] ?? admin.role}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-grey-2" aria-hidden="true" />
        </button>
        {isMenuOpen && (
          <div role="menu" className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-[10px] border border-grey-4 bg-white py-1 shadow-lg">
            <div className="border-b border-grey-4 px-4 py-3">
              <p className="truncate text-sm font-semibold text-grey-1">{name}</p>
              <p className="truncate text-xs text-grey-2">{admin.email}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-error-1 hover:bg-error-5 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
