import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Users,
} from "lucide-react";
import type { AccessContext, NavPermission } from "@/lib/auth/permissions";
import { canAccessNav } from "@/lib/auth/permissions";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  requires?: NavPermission;
};

export const adminNavItems: AdminNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "/clients", icon: Building2, requires: "clients" },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Payments", href: "/payments", icon: CreditCard, requires: "payments" },
  { title: "Employees", href: "/employees", icon: Users, requires: "employees" },
];

export function visibleNavItems(ctx: AccessContext): AdminNavItem[] {
  return adminNavItems.filter((item) => canAccessNav(ctx, item.requires));
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
