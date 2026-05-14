"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProject, updateProject } from "@/app/actions/projects";
import { listClients } from "@/app/actions/clients";
import { projectUpdateFormSchema } from "@/lib/validations";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

type ClientOpt = { id: string; companyName: string; name: string };

type ProjectPayload = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  startDate: Date | string | null;
  deadline: Date | string | null;
  tags: string[];
};

const schema = projectUpdateFormSchema;
type FormValues = z.infer<typeof projectUpdateFormSchema>;

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

export function ProjectDetailActions({
  project,
  /** Optional: caller may pre-supply clients. If absent, they load on first dialog open. */
  clients: initialClients,
  compact = false,
  toolbar = false,
  className,
}: {
  project: ProjectPayload;
  clients?: ClientOpt[];
  compact?: boolean;
  toolbar?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [clients, setClients] = useState<ClientOpt[]>(initialClients ?? []);
  const [clientsLoading, setClientsLoading] = useState(false);
  const clientsLoadedRef = useRef<boolean>(Boolean(initialClients?.length));

  const ensureClients = useCallback(async () => {
    if (clientsLoadedRef.current) return;
    clientsLoadedRef.current = true;
    setClientsLoading(true);
    try {
      const rows = await listClients();
      setClients(
        rows.map((c) => ({
          id: c.id,
          companyName: c.companyName,
          name: c.name,
        }))
      );
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const editDefaults = useMemo<FormValues>(
    () => ({
      id: project.id,
      clientId: project.clientId,
      name: project.name,
      description: project.description ?? "",
      startDate: toDateTimeInput(project.startDate),
      deadline: toDateTimeInput(project.deadline) || "",
    }),
    [project]
  );

  const clientSelectItems = useMemo(
    () =>
      Object.fromEntries(
        clients.map((c) => [c.id, `${c.companyName} (${c.name})`] as const)
      ),
    [clients]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editDefaults,
  });

  const { register, handleSubmit, setValue, watch, formState, reset } = form;
  const clientId = watch("clientId");

  function openEdit() {
    reset(editDefaults);
    setEditOpen(true);
    void ensureClients();
  }

  function onSubmitEdit(values: FormValues) {
    setEditOpen(false);
    startTransition(async () => {
      await updateProject({
        id: values.id,
        clientId: values.clientId,
        name: values.name,
        description: values.description?.trim() ? values.description : null,
        startDate: values.startDate?.trim() ? values.startDate : null,
        deadline: values.deadline,
        tags: project.tags ?? [],
      });
    });
  }

  function handleDelete() {
    setDeleteOpen(true);
  }

  return (
    <>
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete project?"
        description={`Delete “${project.name}”? It will be removed from the active project list.`}
        onConfirm={async () => {
          await deleteProject(project.id);
          router.push("/projects");
        }}
      />

      <div
        className={cn(
          toolbar
            ? "flex shrink-0 items-center justify-end gap-1"
            : cn("flex flex-wrap", compact ? "gap-1.5 pt-0" : "gap-2 pt-2"),
          className
        )}
      >
        {toolbar ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              onClick={openEdit}
              aria-label="Edit project"
            >
              <Pencil aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              aria-label="Delete project"
            >
              <Trash2 aria-hidden />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full",
                compact ? "h-7 gap-1 px-2.5 text-xs" : "gap-2"
              )}
              onClick={openEdit}
            >
              <Pencil className={compact ? "size-3" : "size-4"} aria-hidden />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
                compact ? "h-7 gap-1 px-2.5 text-xs" : "gap-2"
              )}
              onClick={handleDelete}
            >
              <Trash2 className={compact ? "size-3" : "size-4"} aria-hidden />
              Delete
            </Button>
          </>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <input type="hidden" {...register("id")} />
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={clientId}
                items={clientSelectItems}
                onValueChange={(v) => setValue("clientId", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder={clientsLoading ? "Loading clients…" : undefined} />
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
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...register("name")} />
              <FieldError message={formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" rows={3} {...register("description")} />
              <FieldError message={formState.errors.description?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-start">Start date</Label>
              <Input id="edit-start" type="datetime-local" {...register("startDate")} />
              <FieldError message={formState.errors.startDate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input id="edit-deadline" type="datetime-local" {...register("deadline")} />
              <FieldError message={formState.errors.deadline?.message} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending || clientsLoading}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
