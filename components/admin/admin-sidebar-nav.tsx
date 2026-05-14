"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
      {adminNavItems.map((item, index) => {
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
            <motion.span
              className="min-w-0 overflow-hidden whitespace-nowrap"
              initial={false}
              animate={{
                opacity: collapsed ? 0 : 1,
              }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: collapsed ? 0 : "auto",
                pointerEvents: collapsed ? "none" : "auto",
              }}
            >
              {item.title}
            </motion.span>
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-y-1 left-1 right-1 -z-10 rounded-md bg-sidebar-primary/15"
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              />
            )}
          </>
        );

        const link = (
          <Link
            href={item.href}
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
            <motion.div
              key={item.href}
              className="shrink-0"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
            >
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
            </motion.div>
          );
        }

        return (
          <motion.div
            key={item.href}
            className="shrink-0"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            {link}
          </motion.div>
        );
      })}
    </nav>
  );
}
