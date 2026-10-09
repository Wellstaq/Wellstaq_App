import type { AdminMe, AdminPermission, AdminRole } from "@/types/admin";

export function can(me: AdminMe | null | undefined, permission: AdminPermission): boolean {
  if (!me) return false;
  return me.role === "super_admin" || me.permissions.includes(permission);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  support: "Support",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Full access, including managing other admins.",
  admin: "Manages organizations, users, events and support.",
  support: "Views records and handles support tickets.",
};
