"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

const RAIL_HEIGHT = "h-[3px]";
const CONNECTOR = "min-w-[1.25rem] max-w-[2.25rem] flex-1 sm:min-w-[1.75rem] sm:max-w-[3rem]";

export function ProjectLifecyclePath({
  projectId,
  status,
  archived,
  embedded = false,
  embeddedDense = false,
  compact = false,
}: Props) {
  const router = useRouter();
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
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        !nestEmbed &&
          "rounded-2xl border border-border/50 bg-muted/20 shadow-sm ring-1 ring-border/30 dark:bg-muted/10 dark:ring-border/20",
        nestEmbed &&
          embeddedDense &&
          "rounded-none border-0 bg-transparent shadow-none ring-0",
        nestEmbed &&
          !embeddedDense &&
          "rounded-xl border border-border/40 bg-muted/[0.08] shadow-sm ring-1 ring-border/25 dark:border-border/30 dark:bg-muted/5"
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
              "mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4 dark:border-border/25",
              compact && "mb-3 gap-2 border-b-0 pb-0"
            )}
          >
            <div className="min-w-0">
              <p
                className={cn(
                  "font-medium tracking-wide text-muted-foreground",
                  compact ? "text-[10px] uppercase" : "text-xs uppercase tracking-wider"
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
              <span className="shrink-0 rounded-md border border-amber-500/35 bg-amber-500/[0.12] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
                Archived
              </span>
            ) : (
              <span className="shrink-0 rounded-md border border-border/50 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Live
              </span>
            )}
          </div>
        ) : (
          <>
            {archived ? (
              <div className="mb-3 flex justify-end px-1 pt-1">
                <span className="rounded-md border border-amber-500/35 bg-amber-500/[0.12] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
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
            "overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50",
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
                        "group relative flex max-w-[9.5rem] flex-col items-stretch rounded-2xl border text-left outline-none transition-all duration-200 ease-out sm:max-w-[11rem]",
                        compact ? "gap-1 px-2.5 py-2" : "gap-1.5 px-3 py-2.5",
                        interactive &&
                          "cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
                        interactive &&
                          "focus-visible:ring-2 focus-visible:ring-[hsl(var(--sidebar-primary)/0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        !interactive && "cursor-not-allowed opacity-60",
                        done &&
                          "border-emerald-500/35 bg-gradient-to-br from-emerald-500/[0.14] to-emerald-600/[0.06] text-emerald-950 shadow-sm dark:from-emerald-500/15 dark:to-emerald-950/20 dark:text-emerald-50",
                        current &&
                          interactive &&
                          "z-[1] border-[hsl(var(--sidebar-primary))] bg-background shadow-[0_4px_24px_-8px_hsl(var(--sidebar-primary)/0.35)] dark:bg-card dark:shadow-[0_6px_28px_-10px_hsl(var(--sidebar-primary)/0.4)]",
                        !done &&
                          !current &&
                          "border-border/50 bg-background/80 text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-border hover:bg-muted/30 hover:text-foreground dark:bg-muted/20 dark:shadow-none dark:hover:bg-muted/35"
                      )}
                    >
                      <span className="sr-only">Set stage to {label}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-colors duration-200",
                            compact && "size-6 text-[10px]",
                            done &&
                              "bg-emerald-600 text-white dark:bg-emerald-500",
                            current &&
                              "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]",
                            !done &&
                              !current &&
                              "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
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
                            <Check className={compact ? "size-3" : "size-3.5"} strokeWidth={2.5} aria-hidden />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 leading-snug",
                            compact ? "text-[10px] font-medium leading-tight" : "text-[11px] font-medium leading-tight sm:text-xs",
                            current && "text-foreground",
                            done && !current && "text-emerald-950/90 dark:text-emerald-100/90",
                            !done && !current && "text-muted-foreground group-hover:text-foreground"
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
                        "relative flex items-center self-center",
                        compact ? "mx-0.5" : "mx-0.5 sm:mx-1"
                      )}
                      aria-hidden
                    >
                      <div
                        className={cn(
                          RAIL_HEIGHT,
                          "w-full rounded-full transition-colors duration-300 ease-out",
                          idx < safeIdx && "bg-emerald-500/70 dark:bg-emerald-400/65",
                          idx === safeIdx &&
                            "bg-gradient-to-r from-emerald-500/70 via-[hsl(var(--sidebar-primary)/0.55)] to-border/50 dark:from-emerald-400/60 dark:via-[hsl(var(--sidebar-primary)/0.5)] dark:to-border/40",
                          idx > safeIdx && "bg-border/60 dark:bg-border/50"
                        )}
                      />
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
