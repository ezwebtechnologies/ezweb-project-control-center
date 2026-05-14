import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type RouteLoadingProps = {
  headline?: string;
  subline?: string;
  variant?: "section" | "fullscreen";
  showSkeleton?: boolean;
};

const gridBg: CSSProperties = {
  backgroundImage: [
    "linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px)",
    "linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)",
  ].join(","),
  backgroundSize: "48px 48px",
};

export function RouteLoading({
  headline = "Loading",
  subline = "Preparing your workspace…",
  variant = "section",
  showSkeleton = true,
}: RouteLoadingProps) {
  const card = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-md ring-1 ring-border/30 backdrop-blur-md",
        variant === "fullscreen" ? "w-full max-w-md px-8 py-12" : "w-full px-6 py-10 sm:px-8 sm:py-12"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-50"
        aria-hidden
        style={gridBg}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.45_0.12_270/0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.14_270/0.18),transparent)]"
        aria-hidden
      />

      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-sidebar-primary/18 text-sm font-semibold tracking-tight text-sidebar-primary ring-1 ring-sidebar-border/50">
          EZ
        </div>
        <Loader2
          className="size-9 shrink-0 animate-spin text-sidebar-primary"
          aria-hidden
        />
        <p className="mt-5 text-base font-semibold tracking-tight text-foreground">
          {headline}
        </p>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {subline}
        </p>
        <p className="mt-4 text-[11px] text-muted-foreground/80">{siteConfig.name}</p>
      </div>

      {showSkeleton ? (
        <div className="mt-8 space-y-3 border-t border-border/40 pt-8">
          <div className="mx-auto h-3 w-full max-w-[280px] animate-pulse rounded-full bg-muted/50" />
          <div className="mx-auto h-3 w-4/5 max-w-[220px] animate-pulse rounded-full bg-muted/40" />
          <div className="mx-auto h-3 w-3/5 max-w-[160px] animate-pulse rounded-full bg-muted/35" />
        </div>
      ) : null}
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="relative flex min-h-dvh w-full items-center justify-center bg-background px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.25] dark:opacity-40"
          aria-hidden
          style={gridBg}
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,oklch(0.45_0.12_270/0.14),transparent)] dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,oklch(0.55_0.14_270/0.2),transparent)]"
          aria-hidden
        />
        {card}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{card}</div>
  );
}
