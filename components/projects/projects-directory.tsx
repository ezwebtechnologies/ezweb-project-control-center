"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ProjectPriority } from "@prisma/client";
import { Plus } from "lucide-react";
import { createProject } from "@/app/actions/projects";
import { projectCreateFormSchema } from "@/lib/validations";
import {
  coerceProjectStatus,
  computeProjectPriority,
  progressForStage,
} from "@/lib/project-lifecycle";
import { projectPriorityLabels, projectStatusLabels } from "@/lib/labels";
import { formatDate, todayStartDateTimeLocalValue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDashboardSearch } from "@/components/providers/dashboard-search-provider";

type ClientOpt = { id: string; companyName: string; name: string };

type ProjectRow = {
  id: string;
  name: string;
  deadline: Date | string | null;
  status: string;
  client: ClientOpt;
};

const schema = projectCreateFormSchema;
type FormValues = z.infer<typeof projectCreateFormSchema>;

function toDate(d: Date | string | null): Date | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? null : date;
}

function priorityBadgeClass(p: ProjectPriority) {
  switch (p) {
    case "OVERDUE":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "CRITICAL":
      return "border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-300";
    case "HIGH":
      return "border-amber-500/35 bg-amber-500/8 text-amber-900 dark:text-amber-200";
    case "MEDIUM":
      return "border-border/60 bg-muted/40 text-foreground";
    default:
      return "border-border/50 bg-muted/25 text-muted-foreground";
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function ProjectsDirectory({
  projects,
  clients,
}: {
  projects: ProjectRow[];
  clients: ClientOpt[];
}) {
  const router = useRouter();
  const { query } = useDashboardSearch();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const getEmptyForm = useCallback(
    (): FormValues => ({
      clientId: clients[0]?.id ?? "",
      name: "",
      description: "",
      startDate: todayStartDateTimeLocalValue(),
      deadline: "",
    }),
    [clients]
  );

  const clientSelectItems = useMemo(
    () =>
      Object.fromEntries(
        clients.map((c) => [c.id, `${c.companyName} (${c.name})`] as const)
      ),
    [clients]
  );

  const visibleProjects = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.client.companyName.toLowerCase().includes(s) ||
        p.client.name.toLowerCase().includes(s)
    );
  }, [projects, query]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getEmptyForm(),
  });

  const { register, handleSubmit, setValue, watch, formState, reset } = form;
  const clientId = watch("clientId");

  function openCreate() {
    reset(getEmptyForm());
    setOpen(true);
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await createProject({
        clientId: values.clientId,
        name: values.name,
        description: values.description?.trim() ? values.description : null,
        startDate: values.startDate?.trim() ? values.startDate : null,
        deadline: values.deadline,
        tags: [],
      });
      setOpen(false);
      reset(getEmptyForm());
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Create projects with an existing client.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="w-full gap-2 rounded-full sm:w-auto"
          disabled={!clients.length}
        >
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      {!clients.length ? (
        <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Add a client first in{" "}
          <Link href="/clients" className="font-medium text-foreground underline-offset-4 hover:underline">
            Clients
          </Link>{" "}
          before creating a project.
        </p>
      ) : null}

      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md">
        {visibleProjects.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {projects.length === 0 ? (
              <>
                No projects yet. Use <span className="font-medium text-foreground">New project</span>{" "}
                to add one.
              </>
            ) : (
              <>No projects match your search.</>
            )}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="min-w-[8.5rem] font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Deadline</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="min-w-[6.5rem] text-center font-semibold">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleProjects.map((p) => {
                const dl = toDate(p.deadline);
                const livePriority = computeProjectPriority(dl);
                const stage = coerceProjectStatus(String(p.status));
                const progressPct = progressForStage(stage);
                const statusLabel = projectStatusLabels[stage];
                return (
                  <TableRow key={p.id} className="border-border/40">
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-foreground underline-offset-4 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.client.companyName}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 max-w-[11rem] text-xs font-medium text-foreground">
                        {statusLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {formatDate(p.deadline)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-medium", priorityBadgeClass(livePriority))}
                      >
                        {projectPriorityLabels[livePriority]}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-1.5 align-middle">
                      <div
                        className="relative mx-auto flex h-7 w-full max-w-[5.5rem] items-center justify-center overflow-hidden rounded-md border border-border/50 bg-muted/40 dark:bg-muted/30 sm:max-w-[6rem]"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progressPct}
                        aria-label={`Project progress ${progressPct}%`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-300 ease-out"
                          style={{ width: `${progressPct}%` }}
                          aria-hidden
                        >
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-500"
                            aria-hidden
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent dark:from-white/12"
                            aria-hidden
                          />
                          <div
                            className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.2)]"
                            aria-hidden
                          />
                        </div>
                        <span className="relative z-10 text-[10px] font-semibold tabular-nums text-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {progressPct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={clientId}
                items={clientSelectItems}
                onValueChange={(v) => setValue("clientId", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--anchor-width)]">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {`${c.companyName} (${c.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={formState.errors.clientId?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-name">Name</Label>
              <Input id="proj-name" placeholder="Project name" {...register("name")} />
              <FieldError message={formState.errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                rows={3}
                placeholder="Brief scope or notes"
                {...register("description")}
              />
              <FieldError message={formState.errors.description?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-start">Start date</Label>
              <Input id="proj-start" type="datetime-local" {...register("startDate")} />
              <FieldError message={formState.errors.startDate?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-deadline">Deadline</Label>
              <Input id="proj-deadline" type="datetime-local" {...register("deadline")} />
              <FieldError message={formState.errors.deadline?.message} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Create project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
