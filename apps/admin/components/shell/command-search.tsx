"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Building2, CalendarDays, CornerDownLeft, CreditCard, Inbox, LayoutDashboard, ScrollText, Search, Settings2, ShieldCheck, UserRound, UserSearch } from "lucide-react";
import { ModalLayer } from "@wellstaq/ui/modal-layer";
import { cn } from "@wellstaq/ui/utils";
import { useAdmin } from "@/components/providers/admin-session";
import { can } from "@/lib/permissions";
import type { AdminPermission } from "@/types/admin";

interface Command {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  href: string;
}

const PAGES: (Omit<Command, "id"> & { permission?: AdminPermission })[] = [
  { label: "Overview", hint: "Page", icon: LayoutDashboard, href: "/" },
  { label: "Organizations", hint: "Page", icon: Building2, href: "/organizations", permission: "organizations.read" },
  { label: "Find a user", hint: "Page", icon: UserSearch, href: "/users", permission: "organizations.read" },
  { label: "Find a payment", hint: "Page", icon: CreditCard, href: "/payments", permission: "organizations.read" },
  { label: "Individual users", hint: "Page", icon: UserRound, href: "/individuals", permission: "individuals.read" },
  { label: "Platform events", hint: "Page", icon: CalendarDays, href: "/events", permission: "events.read" },
  { label: "Create a platform event", hint: "Action", icon: CalendarDays, href: "/events?create=1", permission: "events.manage" },
  { label: "Support inbox", hint: "Page", icon: Inbox, href: "/support", permission: "support.read" },
  { label: "Admin team", hint: "Page", icon: ShieldCheck, href: "/team", permission: "admins.manage" },
  { label: "Audit log", hint: "Page", icon: ScrollText, href: "/audit-log", permission: "audit.read" },
  { label: "Settings", hint: "Page", icon: Settings2, href: "/settings" },
];

export function CommandSearch() {
  const router = useRouter();
  const admin = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  const commands = useMemo<Command[]>(() => {
    const term = query.trim();
    const lower = term.toLowerCase();
    const pages = PAGES.filter((page) => (!page.permission || can(admin, page.permission)) && (!lower || page.label.toLowerCase().includes(lower))).map((page) => ({ ...page, id: page.href }));
    if (!term) return pages;
    const searches: Command[] = [];
    if (can(admin, "organizations.read")) searches.push({ id: "search-orgs", label: `Search organizations for "${term}"`, hint: "Search", icon: Building2, href: `/organizations?q=${encodeURIComponent(term)}` });
    if (can(admin, "organizations.read")) searches.push({ id: "search-users", label: `Find a user named "${term}"`, hint: "Search", icon: UserSearch, href: `/users?q=${encodeURIComponent(term)}` });
    if (can(admin, "organizations.read")) searches.push({ id: "search-payments", label: `Find a payment matching "${term}"`, hint: "Search", icon: CreditCard, href: `/payments?q=${encodeURIComponent(term)}` });
    if (can(admin, "individuals.read")) searches.push({ id: "search-people", label: `Search individual users for "${term}"`, hint: "Search", icon: UserRound, href: `/individuals?q=${encodeURIComponent(term)}` });
    return [...searches, ...pages];
  }, [admin, query]);

  const go = (command: Command | undefined) => {
    if (!command) return;
    setIsOpen(false);
    router.push(command.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden h-10 w-full max-w-[460px] items-center gap-3 rounded-[10px] border border-line bg-white px-4 text-left text-[15px] text-grey-3 transition-colors hover:border-grey-3 md:flex"
      >
        <Search className="h-[18px] w-[18px] text-grey-2" strokeWidth={1.7} aria-hidden="true" />
        <span className="flex-1 truncate">Search organizations, people, pages</span>
        <kbd className="rounded-[6px] border border-line bg-grey-5 px-1.5 py-0.5 font-sans text-[11px] font-medium text-grey-2">Ctrl K</kbd>
      </button>
      <button type="button" onClick={() => setIsOpen(true)} aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-[10px] text-grey-2 hover:bg-grey-5 md:hidden">
        <Search className="h-5 w-5" strokeWidth={1.7} />
      </button>

      {isOpen && (
        <ModalLayer className="flex items-start justify-center bg-grey-1/30 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-[560px] overflow-hidden rounded-[16px] border border-line bg-white shadow-[0_24px_48px_-16px_rgba(26,26,26,0.25)]">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-5 w-5 text-grey-3" strokeWidth={1.7} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActive(0); }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsOpen(false);
                  else if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(commands.length - 1, value + 1)); }
                  else if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(0, value - 1)); }
                  else if (event.key === "Enter") { event.preventDefault(); go(commands[active]); }
                }}
                role="combobox"
                aria-expanded="true"
                aria-controls="command-results"
                aria-activedescendant={commands[active] ? `command-${commands[active].id}` : undefined}
                placeholder="Type to search or jump to a page"
                className="h-10 flex-1 bg-transparent text-[15px] text-grey-1 placeholder:text-grey-3 focus:outline-none"
              />
              <kbd className="rounded-[6px] border border-line bg-grey-5 px-1.5 py-0.5 text-[11px] font-medium text-grey-2">Esc</kbd>
            </div>
            <ul id="command-results" role="listbox" aria-label="Results" className="max-h-[360px] overflow-y-auto p-2">
              {commands.length === 0 && <li className="px-3 py-6 text-center text-sm text-grey-3">No pages match that.</li>}
              {commands.map((command, index) => (
                <li key={command.id} id={`command-${command.id}`} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(command)}
                    className={cn("flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm", index === active ? "bg-primary-5 text-grey-1" : "text-grey-2")}
                  >
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]", index === active ? "bg-white text-primary-hover" : "bg-grey-5 text-grey-2")}>
                      <command.icon className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <span className="flex-1 truncate font-medium">{command.label}</span>
                    {index === active ? <CornerDownLeft className="h-4 w-4 text-grey-3" strokeWidth={1.7} aria-hidden="true" /> : <span className="text-xs text-grey-3">{command.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ModalLayer>
      )}
    </>
  );
}
