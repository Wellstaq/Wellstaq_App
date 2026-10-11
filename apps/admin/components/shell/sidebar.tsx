"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Building2, CalendarDays, Inbox, LayoutDashboard, PanelLeftClose, PanelLeftOpen, ScrollText, Settings2, ShieldCheck, UserRound, UserSearch, X } from "lucide-react";
import { cn } from "@wellstaq/ui/utils";
import { Avatar } from "@/components/ui/avatar";
import { useAdmin } from "@/components/providers/admin-session";
import { useOverview } from "@/components/providers/overview";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { formatNumber, fullName } from "@/lib/format";
import type { AdminPermission } from "@/types/admin";

const LOGO = "/assets/logo.webp";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: AdminPermission;
  badge?: "support";
}

const GROUPS: { title?: string; items: NavItem[] }[] = [
  { items: [{ name: "Overview", href: "/", icon: LayoutDashboard }] },
  {
    title: "Customers",
    items: [
      { name: "Organizations", href: "/organizations", icon: Building2, permission: "organizations.read" },
      { name: "Find a user", href: "/users", icon: UserSearch, permission: "organizations.read" },
      { name: "Individual users", href: "/individuals", icon: UserRound, permission: "individuals.read" },
    ],
  },
  { title: "Engagement", items: [{ name: "Platform events", href: "/events", icon: CalendarDays, permission: "events.read" }] },
  { title: "Help desk", items: [{ name: "Support inbox", href: "/support", icon: Inbox, permission: "support.read", badge: "support" }] },
];

const FOOTER_ITEMS: NavItem[] = [
  { name: "Admin team", href: "/team", icon: ShieldCheck, permission: "admins.manage" },
  { name: "Audit log", href: "/audit-log", icon: ScrollText, permission: "audit.read" },
  { name: "Settings", href: "/settings", icon: Settings2 },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const admin = useAdmin();
  const overview = useOverview();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const name = fullName(admin);

  const visible = (items: NavItem[]) => items.filter((item) => !item.permission || can(admin, item.permission));
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const badgeValue = (badge?: NavItem["badge"]) => (badge === "support" ? overview.data?.support.open : undefined);

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    const badge = badgeValue(item.badge);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        aria-label={isCollapsed ? item.name : undefined}
        title={isCollapsed ? item.name : undefined}
        className={cn(
          "relative flex h-11 items-center gap-3 rounded-[8px] px-3 text-[15px] transition-colors",
          isCollapsed && "justify-center px-0",
          active ? "bg-primary-5 font-medium text-primary-hover" : "text-grey-2 hover:bg-grey-5 hover:text-grey-1",
        )}
      >
        {active && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary-1" />}
        <item.icon className="h-[19px] w-[19px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
        {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
        {!isCollapsed && badge !== undefined && (
          <span className={cn("text-[13px] font-semibold tabular-nums", badge > 0 ? "text-primary-hover" : "text-grey-3")}>
            {formatNumber(badge)}
            <span className="sr-only"> open</span>
          </span>
        )}
      </Link>
    );
  };

  const groups = GROUPS.map((group) => ({ ...group, items: visible(group.items) })).filter((group) => group.items.length);
  const footerItems = visible(FOOTER_ITEMS);

  return (
    <nav aria-label="Admin" className={cn("flex h-dvh shrink-0 flex-col border-r border-line bg-white transition-[width] duration-300", isCollapsed ? "w-[76px]" : "w-[264px]")}>
      <div className={cn("flex h-[60px] shrink-0 items-center px-5", isCollapsed ? "justify-center px-0" : "justify-between")}>
        {!isCollapsed && (
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5 rounded-sm">
            <Image src={LOGO} alt="Wellstaq" width={501} height={120} className="h-[30px] w-auto" priority />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-10 w-10 items-center justify-center rounded-[8px] border border-line text-grey-2 transition-colors hover:bg-grey-5 hover:text-grey-1 lg:flex"
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" strokeWidth={1.7} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.7} />}
        </button>
        <button type="button" onClick={onClose} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-line text-grey-2 hover:text-grey-1 lg:hidden">
          <X className="h-4 w-4" strokeWidth={1.7} />
        </button>
      </div>

      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 pb-4">
        <div className="space-y-5">
          {groups.map((group, index) => (
            <div key={group.title ?? index}>
              {group.title && !isCollapsed && <p className="mb-1.5 px-3 text-[13px] font-medium text-grey-1">{group.title}</p>}
              {group.title && isCollapsed && <div className="mx-3 mb-2 border-t border-line" aria-hidden="true" />}
              <div className="space-y-0.5">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6">
          {footerItems.length > 0 && <div className="space-y-0.5 border-t border-line pt-4">{footerItems.map(renderItem)}</div>}
          <div className={cn("mt-4 flex items-center gap-3 rounded-[12px] bg-grey-5 p-3", isCollapsed && "justify-center bg-transparent p-0")}>
            <Avatar name={name} src={admin.avatarUrl} size={40} />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-grey-1">{name}</p>
                <p className="truncate text-[13px] font-medium text-primary-hover">{ROLE_LABELS[admin.role] ?? admin.role}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
