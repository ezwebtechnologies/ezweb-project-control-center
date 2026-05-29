import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const adminNavItems: AdminNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "/clients", icon: Building2 },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Payments", href: "/payments", icon: CreditCard },
  { title: "Employees", href: "/employees", icon: Users },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
