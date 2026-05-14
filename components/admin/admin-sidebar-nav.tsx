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

  const list = adminNavItems.map((item) => {
    const Icon = item.icon;
    const active = isNavActive(pathname, item.href);

    const linkClass = cn(
      "group/nav relative flex w-full min-w-0 items-center outline-none transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
      "focus-visible:ring-2 focus-visible:ring-sidebar-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
      collapsed
        ? "mx-auto aspect-square min-h-[2.75rem] max-w-[2.75rem] justify-center rounded-2xl p-0"
        : "gap-3 rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5",
      active
        ? [
            "text-sidebar-foreground",
            "bg-gradient-to-br from-sidebar-primary/28 via-sidebar-primary/[0.12] to-transparent",
            "shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.28),inset_3px_0_0_0_hsl(var(--sidebar-primary)),0_12px_40px_-18px_hsl(var(--sidebar-primary)/0.55)]",
            "font-semibold tracking-tight",
          ]
        : [
            "border border-transparent font-medium tracking-tight text-sidebar-foreground/65",
            "hover:border-sidebar-border/70 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
            "hover:shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.55)]",
            "active:scale-[0.98]",
          ]
    );

    const iconWrap = cn(
      "relative flex shrink-0 items-center justify-center rounded-xl transition-[background,box-shadow,color,transform] duration-200 ease-out",
      collapsed ? "size-10" : "size-10 sm:size-11",
      active
        ? "bg-[hsl(var(--sidebar-primary)/0.22)] text-[hsl(var(--sidebar-primary-foreground))] shadow-[inset_0_1px_0_0_oklch(1_0_0/12%)]"
        : "bg-sidebar-accent/25 text-sidebar-foreground/55 shadow-[inset_0_0_0_1px_oklch(1_0_0/5%)] group-hover/nav:bg-sidebar-primary/15 group-hover/nav:text-sidebar-primary group-hover/nav:shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.2)]"
    );

    const inner = (
      <>
        <span className={iconWrap} aria-hidden>
          {active ? (
            <span
              className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.14),transparent_55%)]"
              aria-hidden
            />
          ) : null}
          <Icon
            className={cn(
              "relative z-[1] size-[19px] transition-transform duration-200 ease-out sm:size-5",
              !active && "group-hover/nav:scale-[1.06]",
              active && "drop-shadow-[0_1px_10px_hsl(var(--sidebar-primary)/0.35)]"
            )}
            strokeWidth={active ? 2.35 : 2}
          />
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] leading-tight transition-[opacity,width] duration-200 ease-out sm:text-[13.5px]",
            collapsed ? "sr-only" : "opacity-100"
          )}
        >
          {item.title}
        </span>
      </>
    );

    const link = (
      <Link
        href={item.href}
        prefetch
        className={cn(linkClass, "group/nav")}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.title : undefined}
      >
        {inner}
      </Link>
    );

    if (showTooltips && collapsed) {
      return (
        <div key={item.href} className="flex w-full shrink-0 justify-center px-0.5">
          <Tooltip>
            <TooltipTrigger
              delay={280}
              className="flex w-full max-w-[2.75rem] justify-center"
              render={link}
            />
            <TooltipContent
              side="right"
              sideOffset={12}
              className="border-sidebar-border/60 bg-popover/95 font-medium shadow-lg backdrop-blur-md"
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }

    return (
      <div key={item.href} className="w-full shrink-0 px-0.5">
        {link}
      </div>
    );
  });

  if (isSheet) {
    return (
      <nav className="flex flex-col px-3 pb-4 pt-2" aria-label="Main">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/38">
          Workspace
        </p>
        <div
          className={cn(
            "flex flex-col gap-0.5 rounded-2xl border border-sidebar-border/45 p-1",
            "bg-gradient-to-b from-sidebar-accent/[0.38] via-sidebar-accent/[0.14] to-transparent",
            "shadow-[inset_0_1px_0_0_oklch(1_0_0/8%)]"
          )}
        >
          {list}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "flex min-h-0 flex-1 flex-col px-2 pt-2",
        collapsed ? "items-stretch gap-1.5 pb-3" : "items-stretch gap-0 pb-3"
      )}
      aria-label="Main"
    >
      {!collapsed ? (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/38">
          Workspace
        </p>
      ) : null}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden",
          "rounded-2xl border border-sidebar-border/45",
          "bg-gradient-to-b from-sidebar-accent/[0.42] via-sidebar-accent/[0.18] to-transparent",
          "p-1 shadow-[inset_0_1px_0_0_oklch(1_0_0/8%),inset_0_0_0_1px_oklch(0_0_0/4%)]",
          "dark:shadow-[inset_0_1px_0_0_oklch(1_0_0/6%),inset_0_0_0_1px_oklch(1_0_0/4%)]",
          collapsed ? "gap-1.5" : "gap-0.5"
        )}
      >
        {list}
      </div>
    </nav>
  );
}
