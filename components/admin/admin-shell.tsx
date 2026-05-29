"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PanelLeftClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { DashboardSearchProvider } from "@/components/providers/dashboard-search-provider";
import { siteConfig } from "@/lib/site";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ezweb-sidebar-collapsed";

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  return (
    <DashboardSearchProvider>
      <div className="flex h-dvh max-h-dvh w-full min-h-0 overflow-hidden bg-background">
        <aside
          style={{ width: collapsed ? 76 : 268 }}
          className={cn(
            "relative z-40 hidden shrink-0 flex-col border-r border-sidebar-border/70",
            "bg-sidebar/80 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/60",
            "shadow-[inset_-1px_0_0_0_oklch(1_0_0/4%)]",
            "before:pointer-events-none before:absolute before:inset-y-8 before:right-0 before:z-10 before:w-px before:bg-gradient-to-b before:from-transparent before:via-sidebar-primary/25 before:to-transparent",
            "lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col",
            "transition-[width] duration-200 ease-out"
          )}
        >
          <div className="flex h-[3.25rem] shrink-0 items-center gap-2 border-b border-sidebar-border/50 bg-sidebar-accent/[0.12] px-2.5 backdrop-blur-sm">
            <Link
              href="/dashboard"
              prefetch
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-transparent px-1.5 py-1",
                "transition-[border-color,background-color,box-shadow] duration-200",
                "hover:border-sidebar-border/60 hover:bg-sidebar-accent/40 hover:shadow-[0_8px_28px_-18px_rgba(0,0,0,0.25)]"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary/25 to-sidebar-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.25)] ring-1 ring-sidebar-border/40">
                <span className="text-[11px] font-bold tracking-tight text-sidebar-primary">
                  EZ
                </span>
              </div>
              <div
                className={cn(
                  "min-w-0 overflow-hidden transition-[opacity,width] duration-200 ease-out",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                <span className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  {siteConfig.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  Control center
                </span>
              </div>
            </Link>
          </div>

          <AdminSidebarNav
            collapsed={collapsed}
            showTooltips={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />

          <div className="mt-auto shrink-0 border-t border-sidebar-border/50 bg-sidebar-accent/[0.08] p-2 backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 w-full justify-start gap-2 rounded-xl border border-transparent",
                "text-sidebar-foreground/70 transition-[background-color,border-color,color,box-shadow] duration-200",
                "hover:border-sidebar-border/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                "hover:shadow-[inset_0_0_0_1px_oklch(1_0_0/6%)]",
                collapsed && "justify-center px-0"
              )}
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelRightOpen className="size-4 shrink-0" />
              ) : (
                <PanelLeftClose className="size-4 shrink-0" />
              )}
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap text-xs font-medium transition-[opacity,width] duration-150",
                  collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                Collapse
              </span>
            </Button>
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton
            className="w-[min(100%,20rem)] border-sidebar-border/70 bg-sidebar/95 p-0 backdrop-blur-xl sm:max-w-xs"
          >
            <SheetHeader className="border-b border-sidebar-border/60 px-4 py-3 text-left">
              <SheetTitle className="text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100dvh-4.5rem)]">
              <AdminSidebarNav
                collapsed={false}
                showTooltips={false}
                onNavigate={() => setMobileOpen(false)}
                variant="sheet"
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            "lg:transition-[padding] lg:duration-200 lg:ease-out",
            collapsed ? "lg:pl-[76px]" : "lg:pl-[268px]"
          )}
        >
          <AdminHeader user={user} onOpenMobileNav={() => setMobileOpen(true)} />
          <Separator className="opacity-50" />
          <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-50"
              aria-hidden
              style={{
                backgroundImage: [
                  "linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px)",
                  "linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)",
                ].join(","),
                backgroundSize: "48px 48px",
              }}
            />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.45_0.12_270/0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.14_270/0.18),transparent)]" />
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </DashboardSearchProvider>
  );
}
