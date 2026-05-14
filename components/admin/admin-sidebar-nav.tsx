"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems, isNavActive } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AdminSidebarNavProps = {
  collapsed: boolean;
  showTooltips: boolean;
  onNavigate?: () => void;
  /** Mobile drawer: compact stacked list */
  variant?: "default" | "sheet";
};

export function AdminSidebarNav({
  collapsed,
  showTooltips,
  onNavigate,
  variant = "default",
}: AdminSidebarNavProps) {
  const pathname = usePathname();
  const isSheet = variant === "sheet";

  return (
    <nav
      className={cn(
        "flex flex-col px-2",
        isSheet && "gap-0.5 py-3",
        !isSheet && "min-h-0 flex-1 overflow-y-auto",
        !isSheet && (collapsed ? "justify-start gap-2 py-3" : "justify-between py-4")
      )}
      aria-label="Main"
    >
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);
        const linkClass = cn(
          "relative z-0 flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-200",
          active
            ? "bg-sidebar-accent/90 text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_oklch(1_0_0/8%)]"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          collapsed && "justify-center px-0"
        );

        const inner = (
          <>
            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-transform duration-200",
                "group-hover:scale-[1.03]",
                active && "text-sidebar-primary"
              )}
              aria-hidden
            />
            <span
              className={cn(
                "min-w-0 overflow-hidden whitespace-nowrap transition-[opacity,width] duration-200 ease-out",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
              aria-hidden={collapsed}
            >
              {item.title}
            </span>
            {active && (
              <span
                className="absolute inset-y-1 left-1 right-1 -z-10 rounded-md bg-sidebar-primary/15"
                aria-hidden
              />
            )}
          </>
        );

        const link = (
          <Link
            href={item.href}
            prefetch
            className={cn(linkClass, "group")}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? item.title : undefined}
          >
            {inner}
          </Link>
        );

        if (showTooltips && collapsed) {
          return (
            <div key={item.href} className="shrink-0">
              <Tooltip>
                <TooltipTrigger
                  delay={280}
                  className="flex w-full min-w-0"
                  render={link}
                />
                <TooltipContent side="right" sideOffset={10}>
                  {item.title}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        }

        return (
          <div key={item.href} className="shrink-0">
            {link}
          </div>
        );
      })}
    </nav>
  );
}
