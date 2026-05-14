"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ProjectLifecycleStage } from "@/lib/project-lifecycle";
import { ArrowRight, Pencil } from "lucide-react";
import {
  advanceProjectStage,
  updateProject,
} from "@/app/actions/projects";
import { projectFormInputSchema } from "@/lib/validations";
import { nextLifecycleStage, projectStageShortLabels } from "@/lib/project-lifecycle";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = projectFormInputSchema;
type FormValues = z.infer<typeof schema>;

type ClientOpt = { id: string; companyName: string; name: string };

function toDateTimeInput(d: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

type Props = {
  projectId: string;
  status: ProjectLifecycleStage;
  archived: boolean;
  clients: ClientOpt[];
  defaults: FormValues;
};

export function ProjectDetailToolbar({
  projectId,
  status,
  archived,
  clients,
  defaults,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const next = nextLifecycleStage(status);
  const canAdvance = next !== null;
  const nextLabel = next ? projectStageShortLabels[next] : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const { register, handleSubmit, setValue, watch, formState, reset } = form;
  const clientId = watch("clientId");

  const clientSelectItems = useMemo(
    () =>
      Object.fromEntries(
        clients.map((c) => [c.id, `${c.companyName} (${c.name})`] as const)
      ),
    [clients]
  );

  function onSubmit(values: FormValues) {
    const tags = (values.tagsInput ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    startTransition(async () => {
      await updateProject({
        id: projectId,
        clientId: values.clientId,
        name: values.name,
        description: values.description || null,
        startDate: values.startDate || null,
        deadline: values.deadline || null,
        tags,
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border/40 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => {
              reset(defaults);
              setOpen(true);
            }}
          >
            <Pencil className="size-4" aria-hidden />
            Edit details
          </Button>
          <Button
            type="button"
            className="gap-2 rounded-full"
            disabled={!canAdvance || pending || archived}
            title={
              archived
                ? "Unarchive this project to advance stages"
                : !canAdvance
                  ? "All lifecycle stages are complete"
                  : undefined
            }
            onClick={() => {
              startTransition(async () => {
                await advanceProjectStage(projectId);
                router.refresh();
              });
            }}
          >
            {canAdvance ? (
              <>
                Complete stage
                <ArrowRight className="size-4" aria-hidden />
                {nextLabel ? (
                  <span className="max-w-[10rem] truncate text-xs font-normal opacity-90">
                    → {nextLabel}
                  </span>
                ) : null}
              </>
            ) : (
              "Workflow complete"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={clientId}
                items={clientSelectItems}
                onValueChange={(v) =>
                  setValue("clientId", v ?? "", { shouldValidate: true })
                }
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
              <FieldError message={formState.errors.clientId?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-name">Name</Label>
              <Input id="pd-name" {...register("name")} />
              <FieldError message={formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-desc">Description</Label>
              <Textarea id="pd-desc" rows={3} {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-start">Start date</Label>
              <Input id="pd-start" type="datetime-local" {...register("startDate")} />
              <FieldError message={formState.errors.startDate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-deadline">Deadline</Label>
              <Input id="pd-deadline" type="datetime-local" {...register("deadline")} />
              <FieldError message={formState.errors.deadline?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-tags">Tags (comma separated)</Label>
              <Input id="pd-tags" {...register("tagsInput")} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function projectDetailDefaultFormValues(p: {
  clientId: string;
  name: string;
  description: string | null;
  startDate: Date | string | null;
  deadline: Date | string | null;
  tags: string[];
}): FormValues {
  return {
    clientId: p.clientId,
    name: p.name,
    description: p.description ?? "",
    startDate: toDateTimeInput(p.startDate),
    deadline: toDateTimeInput(p.deadline),
    tagsInput: p.tags.join(", "),
  };
}
