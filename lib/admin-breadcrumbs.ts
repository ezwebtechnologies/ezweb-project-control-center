import { adminNavItems } from "@/lib/admin-nav";

export type BreadcrumbEntry = {
  label: string;
  href: string;
  current?: boolean;
};

const labelByHref = Object.fromEntries(
  adminNavItems.map((item) => [item.href, item.title])
) as Record<string, string>;

export function getAdminBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const trail: BreadcrumbEntry[] = [
    { label: "Dashboard", href: "/dashboard", current: pathname === "/dashboard" },
  ];

  if (pathname === "/dashboard") {
    return trail;
  }

  const clientDetail = /^\/clients\/([^/]+)$/.exec(pathname);
  if (clientDetail) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Clients", href: "/clients" },
      { label: "Client details", href: pathname, current: true },
    ];
  }

  const match = adminNavItems.find(
    (item) => item.href !== "/dashboard" && pathname.startsWith(item.href)
  );

  if (match) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      {
        label: labelByHref[match.href] ?? match.title,
        href: match.href,
        current: true,
      },
    ];
  }

  return [{ label: "Dashboard", href: "/dashboard", current: true }];
}
