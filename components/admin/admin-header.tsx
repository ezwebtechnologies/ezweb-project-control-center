"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AdminAccountMenu, accountInitials } from "@/components/admin/admin-account-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AccountUser } from "@/components/admin/admin-account-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getAdminBreadcrumbs, type BreadcrumbEntry } from "@/lib/admin-breadcrumbs";
import { useDashboardSearch } from "@/components/providers/dashboard-search-provider";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  user: AccountUser;
  onOpenMobileNav: () => void;
  className?: string;
};

function MobileBreadcrumbTrail({ crumbs }: { crumbs: BreadcrumbEntry[] }) {
  const current = crumbs.find((c) => c.current) ?? crumbs[crumbs.length - 1];
  if (!current) return null;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 md:hidden">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.length > 1 && (
          <>
            <li className="min-w-0 shrink truncate">
              <Link
                href={crumbs[0]!.href}
                className="transition-colors hover:text-foreground"
              >
                {crumbs[0]!.label}
              </Link>
            </li>
            <li aria-hidden className="shrink-0 text-muted-foreground/80">
              /
            </li>
          </>
        )}
        <li className="min-w-0 truncate font-medium text-foreground">
          {current.label}
        </li>
      </ol>
    </nav>
  );
}

function dashboardSearchPlaceholder(pathname: string) {
  if (pathname === "/projects") return "Search projects or clients…";
  if (pathname === "/clients") return "Search clients…";
  if (pathname === "/payments") return "Search projects, clients, or expenses…";
  return "Search projects, clients, or expenses…";
}

export function AdminHeader({ user, onOpenMobileNav, className }: AdminHeaderProps) {
  const pathname = usePathname();
  const { query, setQuery } = useDashboardSearch();
  const crumbs = getAdminBreadcrumbs(pathname);
  const searchPlaceholder = useMemo(
    () => dashboardSearchPlaceholder(pathname),
    [pathname]
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-background/55 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 sm:gap-4 sm:px-6",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu className="size-[18px]" />
      </Button>

      <BrandLogo size="xs" className="hidden shrink-0 sm:flex lg:hidden" />

      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-5">
        <MobileBreadcrumbTrail crumbs={crumbs} />
        <Breadcrumb className="hidden min-w-0 md:block md:flex-1">
          <BreadcrumbList className="flex-nowrap">
            {crumbs.map((crumb, i) => (
              <Fragment key={`${crumb.href}-${crumb.label}`}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="min-w-0">
                  {crumb.current ? (
                    <BreadcrumbPage className="truncate font-medium">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="truncate"
                      render={<Link href={crumb.href} />}
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="relative w-full min-w-0 md:max-w-sm md:flex-shrink-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="text"
            role="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="dashboard-search-input h-9 w-full min-w-0 rounded-full border border-border pl-9 text-sm shadow-inner outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full ring-1 ring-border/60 transition-[transform,box-shadow] hover:bg-muted/40 hover:ring-border"
                aria-label="Account menu"
              >
                <Avatar className="size-7 border border-border/50">
                  <AvatarFallback className="bg-sidebar-primary/20 text-xs font-medium text-sidebar-primary">
                    {accountInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-52">
            <AdminAccountMenu user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
