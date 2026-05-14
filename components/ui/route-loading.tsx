import type { CSSProperties } from "react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type RouteLoadingProps = {
  headline?: string;
  subline?: string;
  variant?: "section" | "fullscreen";
  /** Renders a richer page-skeleton (header strip, KPI row, list rows) for the
   *  section variant. Defaults to true. Has no effect on `fullscreen`. */
  showSkeleton?: boolean;
};

const gridBg: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px)," +
    "linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
};

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/30",
        className
      )}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

function IndeterminateProgress() {
  return (
    <div
      className="relative h-[3px] w-full overflow-hidden rounded-full bg-sidebar-primary/10"
      aria-hidden
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-2/5 rounded-full",
          "bg-gradient-to-r from-transparent via-sidebar-primary to-transparent",
          "animate-indeterminate-bar"
        )}
      />
    </div>
  );
}

function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center",
        size === "lg" ? "size-20" : "size-14"
      )}
    >
      {/* spinning conic ring */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full animate-orbit",
          "bg-[conic-gradient(from_120deg,transparent_0deg,oklch(0.62_0.2_264/0.65)_120deg,transparent_220deg)]",
          "[mask-image:radial-gradient(circle,transparent_55%,black_57%,black_98%,transparent_100%)]",
          "[-webkit-mask-image:radial-gradient(circle,transparent_55%,black_57%,black_98%,transparent_100%)]"
        )}
      />
      {/* mark */}
      <div
        className={cn(
          "relative grid place-items-center rounded-2xl",
          "bg-sidebar/80 ring-1 ring-sidebar-border/50 shadow-[inset_0_0_0_1px_oklch(1_0_0/6%)]",
          size === "lg" ? "size-14" : "size-10"
        )}
      >
        <span
          className={cn(
            "font-semibold tracking-tight text-sidebar-primary",
            size === "lg" ? "text-base" : "text-[12px]"
          )}
        >
          EZ
        </span>
      </div>
    </div>
  );
}

function FullscreenLoading({ headline, subline }: { headline: string; subline: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-4 py-16"
    >
      {/* ambient bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.25] dark:opacity-40"
        style={gridBg}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,oklch(0.55_0.14_270/0.18),transparent)] dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,oklch(0.55_0.14_270/0.22),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/2 -z-10 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-sidebar-primary/10 blur-3xl"
      />

      <div className="relative flex w-full max-w-md flex-col items-center text-center animate-route-fade">
        <BrandMark size="lg" />

        <h2 className="mt-7 text-base font-semibold tracking-tight text-foreground">
          {headline}
        </h2>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {subline}
        </p>

        <div className="mt-8 w-56">
          <IndeterminateProgress />
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
          {siteConfig.name}
        </p>
      </div>
    </div>
  );
}

function SectionLoading({
  headline,
  subline,
  showSkeleton,
}: {
  headline: string;
  subline: string;
  showSkeleton: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative w-full animate-route-fade"
    >
      {/* top thin progress bar — gives an active "loading" feel */}
      <div className="mb-6">
        <IndeterminateProgress />
      </div>

      {/* page header strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {headline}
            </p>
            <p className="mt-1 text-sm text-foreground/80">{subline}</p>
          </div>
        </div>
        {showSkeleton ? (
          <div className="hidden gap-2 sm:flex">
            <ShimmerBar className="h-9 w-24" />
            <ShimmerBar className="h-9 w-32" />
          </div>
        ) : null}
      </div>

      {showSkeleton ? (
        <>
          {/* KPI row */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/50 bg-card/40 p-4 shadow-sm backdrop-blur-md"
              >
                <ShimmerBar className="h-3 w-24" />
                <ShimmerBar className="mt-4 h-7 w-20" />
              </div>
            ))}
          </div>

          {/* primary content card */}
          <div className="mt-8 rounded-2xl border border-border/50 bg-card/40 p-5 shadow-sm backdrop-blur-md sm:p-6">
            <div className="flex items-center justify-between">
              <ShimmerBar className="h-4 w-40" />
              <ShimmerBar className="h-4 w-16" />
            </div>
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-background/30 px-4 py-3"
                >
                  <ShimmerBar className="h-3 w-1/2" />
                  <ShimmerBar className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-8 flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-card/40 p-6 shadow-sm backdrop-blur-md">
          <BrandMark />
        </div>
      )}
    </div>
  );
}

export function RouteLoading({
  headline = "Loading",
  subline = "Preparing your workspace…",
  variant = "section",
  showSkeleton = true,
}: RouteLoadingProps) {
  return variant === "fullscreen" ? (
    <FullscreenLoading headline={headline} subline={subline} />
  ) : (
    <SectionLoading
      headline={headline}
      subline={subline}
      showSkeleton={showSkeleton}
    />
  );
}
