"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { TaskStatus } from "@prisma/client";
import { setProjectLifecycleStage, updateProjectTaskStatus } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  DONE: "Done",
};

export type BuildTaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
};

type Props = {
  projectId: string;
  tasks: BuildTaskRow[];
  archived: boolean;
};

export function ProjectBuildTasksPanel({ projectId, tasks, archived }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [movePending, startMoveTransition] = useTransition();
  const [moveError, setMoveError] = useState<string | null>(null);
  const allDone = tasks.length > 0 && tasks.every((t) => t.status === "DONE");
  const canMoveToUat = allDone;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Scope from requirements is tracked here. Set every task to{" "}
        <span className="font-medium text-foreground">Done</span>, then use the button below to move
        to Client UAT (or use the delivery path above).
      </p>
      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
          No scope tasks yet. If this project had no requirements pages or checklist items, add them
          earlier in the lifecycle, or use the path to adjust the stage.
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{task.title}</span>
              <Select
                value={task.status}
                disabled={archived || pending || movePending}
                onValueChange={(v) => {
                  if (!v || archived) return;
                  const next = v as TaskStatus;
                  if (next === task.status) return;
                  startTransition(async () => {
                    const r = await updateProjectTaskStatus({ taskId: task.id, status: next });
                    if (r.ok) router.refresh();
                  });
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 w-full min-w-[9.5rem] sm:w-[11rem]",
                    (pending || movePending) && "opacity-70"
                  )}
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--anchor-width)]">
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      )}
      {tasks.length > 0 ? (
        <p
          className={cn(
            "text-xs",
            allDone
              ? "font-medium text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          )}
        >
          {allDone
            ? "All build tasks are done — you can move to Client UAT."
            : `${tasks.filter((t) => t.status === "DONE").length} / ${tasks.length} tasks done.`}
        </p>
      ) : null}
      {!archived && canMoveToUat ? (
        <div className="space-y-2 border-t border-border/40 pt-4">
          <Button
            type="button"
            disabled={movePending}
            onClick={() => {
              setMoveError(null);
              startMoveTransition(async () => {
                const r = await setProjectLifecycleStage(projectId, "CLIENT_UAT");
                if (!r.ok) {
                  setMoveError(r.error);
                  return;
                }
                router.refresh();
              });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg sm:w-auto"
          >
            {movePending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Moving…
              </>
            ) : (
              "Move to Client UAT"
            )}
          </Button>
          {moveError ? (
            <p role="alert" className="text-xs text-destructive">
              {moveError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
