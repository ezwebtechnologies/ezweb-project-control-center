"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { ProjectLifecycleStage } from "@/lib/project-lifecycle";
import { setProjectLifecycleStage } from "@/app/actions/projects";
import {
  PROJECT_PATH_ITEMS,
  getProjectPathCurrentIndex,
  pathIndexToTargetStage,
  pathItemKey,
  pathLabelForItem,
} from "@/lib/project-path";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  status: ProjectLifecycleStage;
  archived: boolean;
  embedded?: boolean;
  embeddedDense?: boolean;
  compact?: boolean;
};

const CONNECTOR =
  "min-w-[1.25rem] max-w-[2.25rem] flex-1 sm:min-w-[1.75rem] sm:max-w-[3rem]";

export function ProjectLifecyclePath({
  projectId,
  status,
  archived,
  embedded = false,
  embeddedDense = false,
  compact = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const safeIdx = getProjectPathCurrentIndex(status);
  const lastPathIdx = PROJECT_PATH_ITEMS.length - 1;
  const nestEmbed = embedded || embeddedDense;

  useEffect(() => {
    setPathError(null);
  }, [status]);

  function onSelectColumn(pathIndex: number) {
    if (archived) return;
    const target = pathIndexToTargetStage(pathIndex);
    if (!target) return;
    setPathError(null);
    setLoadingIdx(pathIndex);
    startTransition(async () => {
      const result = await setProjectLifecycleStage(projectId, target);
      setLoadingIdx(null);
      if (!result.ok) {
        setPathError(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        !nestEmbed &&
          "rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm",
        nestEmbed &&
          embeddedDense &&
          "rounded-none border-0 bg-transparent shadow-none",
        nestEmbed &&
          !embeddedDense &&
          "rounded-xl border border-border/50 bg-muted/30 dark:bg-muted/15"
      )}
    >
      <div
        className={cn(
          "relative",
          embeddedDense && "p-0",
          nestEmbed && !compact && !embeddedDense && "px-3 pb-3 pt-3 sm:px-4 sm:pb-4",
          nestEmbed && compact && !embeddedDense && "p-2 sm:p-3",
          !nestEmbed && "p-4 sm:p-5"
        )}
      >
        {!embeddedDense ? (
          <div
            className={cn(
              "mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4",
              compact && "mb-3 gap-2 border-b-0 pb-0"
            )}
          >
            <div className="min-w-0">
              <p
                className={cn(
                  "text-muted-foreground",
                  compact ? "text-[10px] font-medium uppercase tracking-wide" : "text-xs font-medium uppercase tracking-wide"
                )}
              >
                Delivery path
              </p>
              {!compact ? (
                <p className="mt-0.5 text-sm text-foreground/90">
                  Tap a stage to update — saves immediately.
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] text-muted-foreground">Tap a stage.</p>
              )}
            </div>
            {archived ? (
              <span className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-100">
                Archived
              </span>
            ) : (
              <span className="shrink-0 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Live
              </span>
            )}
          </div>
        ) : (
          <>
            {archived ? (
              <div className="mb-3 flex justify-end px-1 pt-1">
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-900 dark:text-amber-100">
                  Archived
                </span>
              </div>
            ) : null}
            <span className="sr-only">
              Project stages — select one to update progress. Changes save immediately.
            </span>
          </>
        )}

        {pathError ? (
          <p
            role="alert"
            className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive sm:mb-3 sm:text-sm"
          >
            {pathError}
          </p>
        ) : null}

        <div
          className={cn(
            "overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/40",
            embeddedDense ? "px-1 pb-1 pt-0" : "px-0.5 pb-0.5",
            nestEmbed && !embeddedDense && !compact && "pb-1"
          )}
        >
          <div
            className="relative mx-auto flex w-max min-w-full items-center justify-center gap-0 py-1"
            role="list"
            aria-label="Project stages"
          >
            {PROJECT_PATH_ITEMS.map((item, idx) => {
              const terminalClosed =
                status === "PROJECT_CLOSED" && idx === lastPathIdx;
              const done = idx < safeIdx || terminalClosed;
              const current = idx === safeIdx && !terminalClosed;
              const last = idx === PROJECT_PATH_ITEMS.length - 1;
              const loading = pending && loadingIdx === idx;
              const interactive = !archived;
              const label = pathLabelForItem(item);

              return (
                <Fragment key={pathItemKey(item)}>
                  <div className="relative flex shrink-0 flex-col items-center" role="listitem">
                    <button
                      type="button"
                      disabled={!interactive || loading}
                      onClick={() => onSelectColumn(idx)}
                      className={cn(
                        "group relative flex max-w-[9.5rem] flex-col items-stretch rounded-xl border text-left outline-none transition-colors duration-150 sm:max-w-[11rem]",
                        compact ? "gap-1 px-2.5 py-2" : "gap-1.5 px-3 py-2.5",
                        interactive &&
                          "cursor-pointer hover:border-border hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        !interactive && "cursor-not-allowed opacity-60",
                        done &&
                          "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-50",
                        current &&
                          interactive &&
                          "border-[hsl(var(--sidebar-primary))] bg-background shadow-sm dark:bg-card",
                        !done &&
                          !current &&
                          "border-border/60 bg-background text-muted-foreground dark:bg-card/80"
                      )}
                    >
                      <span className="sr-only">Set stage to {label}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums",
                            compact && "size-6 text-[10px]",
                            done && "bg-emerald-600 text-white dark:bg-emerald-600",
                            current &&
                              "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]",
                            !done &&
                              !current &&
                              "bg-muted text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          {loading ? (
                            <Loader2
                              className={cn(
                                "animate-spin motion-reduce:animate-none",
                                compact ? "size-3" : "size-3.5"
                              )}
                              aria-hidden
                            />
                          ) : done ? (
                            <Check
                              className={compact ? "size-3" : "size-3.5"}
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 leading-snug",
                            compact
                              ? "text-[10px] font-medium leading-tight"
                              : "text-[11px] font-medium leading-tight sm:text-xs",
                            current && "text-foreground",
                            done && !current && "text-emerald-950 dark:text-emerald-100",
                            !done && !current && "text-muted-foreground"
                          )}
                        >
                          <span className="line-clamp-2">{label}</span>
                        </span>
                      </div>
                    </button>
                  </div>

                  {!last ? (
                    <div
                      className={cn(
                        CONNECTOR,
                        "relative flex items-center self-center py-0.5",
                        compact ? "mx-0.5" : "mx-0.5 sm:mx-1"
                      )}
                      aria-hidden
                    >
                      <div className="relative h-1 w-full">
                        {/* translucent / white base rail — always visible behind progress */}
                        <div
                          className={cn(
                            "absolute inset-0 rounded-full",
                            "bg-neutral-200/90 ring-1 ring-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)]",
                            "dark:bg-white/[0.14] dark:shadow-none dark:ring-white/[0.12]"
                          )}
                        />
                        {/* progress color on top (green / bridge / neutral) */}
                        <div
                          className={cn(
                            "absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-colors duration-200",
                            idx < safeIdx && "bg-emerald-500/70 dark:bg-emerald-500/60",
                            idx === safeIdx &&
                              "bg-gradient-to-r from-emerald-500/75 via-[hsl(var(--sidebar-primary)/0.55)] to-border/55 dark:from-emerald-500/60 dark:via-[hsl(var(--sidebar-primary)/0.5)] dark:to-border/45",
                            idx > safeIdx && "bg-transparent"
                          )}
                        />
                      </div>
                    </div>
                  ) : null}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
