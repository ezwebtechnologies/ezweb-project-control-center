"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ProjectPriority } from "@prisma/client";
import type { ProjectLifecycleStage } from "@/lib/project-lifecycle";
import { Archive, ArchiveRestore, Plus, Trash2 } from "lucide-react";
import {
  archiveProject,
  createProject,
  deleteProject,
  unarchiveProject,
} from "@/app/actions/projects";
import { projectFormInputSchema } from "@/lib/validations";
import { coerceProjectStatus, computeProjectPriority, progressForStage } from "@/lib/project-lifecycle";
import { projectPriorityLabels, projectStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
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
import { Progress } from "@/components/ui/progress";
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
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { cn } from "@/lib/utils";

type ClientOpt = { id: string; companyName: string; name: string };

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectLifecycleStage;
  priority: ProjectPriority;
  startDate: Date | string | null;
  deadline: Date | string | null;
  progress: number;
  tags: string[];
  archivedAt: Date | string | null;
  client: ClientOpt;
};

const schema = projectFormInputSchema;
type FormValues = z.infer<typeof projectFormInputSchema>;

function deadlineAsDate(d: Date | string | null): Date | null {
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

export function ProjectsManager({
  projects,
  clients,
}: {
  projects: ProjectRow[];
  clients: ClientOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const getEmptyForm = useCallback(
    (): FormValues => ({
      clientId: "",
      name: "",
      description: "",
      startDate: "",
      deadline: "",
      tagsInput: "",
    }),
    []
  );

  const clientSelectItems = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c.companyName] as const)),
    [clients]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getEmptyForm(),
  });

  function openCreate() {
    form.reset(getEmptyForm());
    setOpen(true);
  }

  const { register, handleSubmit, setValue, watch, formState } = form;
  const clientId = watch("clientId");

  function onSubmit(values: FormValues) {
    const tags = (values.tagsInput ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    startTransition(async () => {
      await createProject({
        clientId: values.clientId,
        name: values.name,
        description: values.description || null,
        startDate: values.startDate || null,
        deadline: values.deadline || null,
        tags,
      });
      setOpen(false);
      form.reset(getEmptyForm());
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        </div>
        <Button
          onClick={openCreate}
          className="w-full gap-2 rounded-full sm:w-auto"
          disabled={!clients.length}
        >
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => {
              const dl = deadlineAsDate(p.deadline);
              const livePriority = computeProjectPriority(dl);
              const stage = coerceProjectStatus(String(p.status));
              const stageProgress = progressForStage(stage);
              return (
                <TableRow key={p.id} className="border-border/40">
                  <TableCell>
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.archivedAt ? (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Archived
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.client.companyName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="max-w-[10rem] truncate text-[10px]">
                      {projectStatusLabels[stage]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", priorityBadgeClass(livePriority))}
                    >
                      {projectPriorityLabels[livePriority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={stageProgress} className="h-1.5" />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {stageProgress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(p.deadline)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full"
                      onClick={() =>
                        startTransition(async () => {
                          if (p.archivedAt) await unarchiveProject(p.id);
                          else await archiveProject(p.id);
                        })
                      }
                      aria-label={p.archivedAt ? "Unarchive" : "Archive"}
                    >
                      {p.archivedAt ? (
                        <ArchiveRestore className="size-4" />
                      ) : (
                        <Archive className="size-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {deleteTarget ? (
        <ConfirmDestructiveDialog
          open
          onOpenChange={(next) => !next && setDeleteTarget(null)}
          title="Delete project?"
          description={`Soft-delete “${deleteTarget.name}”? This hides it from active views.`}
          onConfirm={async () => {
            await deleteProject(deleteTarget.id);
          }}
        />
      ) : null}

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
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-destructive">
                {formState.errors.clientId?.message}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pname">Name</Label>
              <Input id="pname" {...register("name")} />
              <p className="text-xs text-destructive">
                {formState.errors.name?.message}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea id="pdesc" rows={3} {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pstart">Start date</Label>
              <Input id="pstart" type="datetime-local" {...register("startDate")} />
              <p className="text-xs text-destructive">
                {formState.errors.startDate?.message}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="datetime-local" {...register("deadline")} />
              <p className="text-xs text-destructive">
                {formState.errors.deadline?.message}
              </p>
            </div>
            <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              New projects start at <strong className="text-foreground">Initial Discussion</strong>.
              Priority is calculated from the deadline (Critical within 2 days, High within 7,
              Medium within 14, Low beyond, Overdue if past due). Advance stages from the project
              detail page.
            </p>
            <div className="space-y-2">
              <Label htmlFor="tagsInput">Tags (comma separated)</Label>
              <Input id="tagsInput" {...register("tagsInput")} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
