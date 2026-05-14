"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ezweb-sidebar-collapsed";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
        <motion.aside
          className={cn(
            "relative z-40 hidden shrink-0 flex-col border-r border-sidebar-border/70",
            "bg-sidebar/75 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/55",
            "lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col"
          )}
          initial={false}
          animate={{ width: collapsed ? 76 : 268 }}
          transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.55 }}
        >
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border/60 px-3">
            <Link
              href="/dashboard"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-90"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/18 ring-1 ring-sidebar-border/50">
                <span className="text-[11px] font-semibold tracking-tight text-sidebar-primary">
                  EZ
                </span>
              </div>
              <motion.div
                className="min-w-0 overflow-hidden"
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  {siteConfig.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  Control center
                </span>
              </motion.div>
            </Link>
          </div>

          <AdminSidebarNav
            collapsed={collapsed}
            showTooltips={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />

          <div className="mt-auto shrink-0 border-t border-sidebar-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-2 text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
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
              <motion.span
                className="overflow-hidden whitespace-nowrap text-xs font-medium"
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                transition={{ duration: 0.18 }}
              >
                Collapse
              </motion.span>
            </Button>
          </div>
        </motion.aside>

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
          <AdminHeader onOpenMobileNav={() => setMobileOpen(true)} />
          <Separator className="opacity-50" />
          <motion.div
            key={pathname}
            className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
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
          </motion.div>
        </div>
      </div>
    </DashboardSearchProvider>
  );
}
