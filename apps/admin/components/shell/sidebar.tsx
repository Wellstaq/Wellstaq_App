"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Building2, CalendarDays, LayoutGrid, LifeBuoy, PanelLeftClose, PanelLeftOpen, ScrollText, ShieldCheck, UserRound, X } from "lucide-react";
import { cn } from "@wellstaq/ui/utils";
import { useAdmin } from "@/components/providers/admin-session";
import { can } from "@/lib/permissions";
import type { AdminPermission } from "@/types/admin";

const LOGO = "https://res.cloudinary.com/dv7yvatu2/image/upload/v1772170704/wellstaq_logo_raxmmg.png";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: AdminPermission;
}

const MAIN_NAV: NavItem[] = [
  { name: "Overview", href: "/", icon: LayoutGrid },
  { name: "Organizations", href: "/organizations", icon: Building2, permission: "organizations.read" },
  { name: "Individuals", href: "/individuals", icon: UserRound, permission: "individuals.read" },
  { name: "Events", href: "/events", icon: CalendarDays, permission: "events.read" },
  { name: "Support", href: "/support", icon: LifeBuoy, permission: "support.read" },
];

const ADMIN_NAV: NavItem[] = [
  { name: "Admin team", href: "/team", icon: ShieldCheck, permission: "admins.manage" },
  { name: "Audit log", href: "/audit-log", icon: ScrollText, permission: "audit.read" },
];

function ActivePageStroke() {
  return <span aria-hidden="true" className="absolute right-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-secondary-1" />;
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const admin = useAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const visible = (items: NavItem[]) => items.filter((item) => !item.permission || can(admin, item.permission));
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const adminItems = visible(ADMIN_NAV);

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        aria-label={isCollapsed ? item.name : undefined}
        title={isCollapsed ? item.name : undefined}
        className={cn(
          "relative flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
          isCollapsed && "justify-center",
          active ? "bg-primary-5 font-bold text-primary-hover" : "font-medium text-grey-2 hover:bg-grey-5",
        )}
      >
        <item.icon size={18} strokeWidth={2} className="shrink-0" aria-hidden="true" />
        {!isCollapsed && <span className="whitespace-nowrap text-sm">{item.name}</span>}
        {active && <ActivePageStroke />}
      </Link>
    );
  };

  return (
    <nav aria-label="Admin" className={cn("flex h-dvh shrink-0 flex-col border-r border-grey-4 bg-white transition-[width] duration-300", isCollapsed ? "w-16" : "w-[227px]")}>
      <div className={cn("flex items-center px-3 pt-8", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <Link href="/" onClick={onClose} className="flex flex-col gap-1.5 rounded-sm">
            <Image src={LOGO} alt="Wellstaq" width={100} height={28} className="object-contain" referrerPolicy="no-referrer" priority />
            <span className="w-fit rounded-[6px] border border-grey-4 bg-grey-5 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-grey-2">Admin console</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden shrink-0 rounded-md border border-grey-4 bg-white p-1 text-grey-2 hover:text-grey-1 lg:flex"
        >
          {isCollapsed ? <PanelLeftOpen size={14} strokeWidth={2} /> : <PanelLeftClose size={14} strokeWidth={2} />}
        </button>
        <button type="button" onClick={onClose} aria-label="Close menu" className="shrink-0 rounded-md border border-grey-4 bg-white p-1 text-grey-2 hover:text-grey-1 lg:hidden">
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-6 pl-3 pr-5 pt-6">
        <div className="space-y-1">{visible(MAIN_NAV).map(renderItem)}</div>

        {adminItems.length > 0 && (
          <div className="mt-auto border-t border-grey-4 pt-3">
            {!isCollapsed && <p className="mb-2 px-3 text-xs font-semibold text-grey-3">Access and compliance</p>}
            <div className="space-y-1">{adminItems.map(renderItem)}</div>
          </div>
        )}
      </div>
    </nav>
  );
}
