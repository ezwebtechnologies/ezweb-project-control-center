"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { deleteClient, updateClient } from "@/app/actions/clients";
import { clientCreateSchema } from "@/lib/validations";
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
import { formatDateTime } from "@/lib/format";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

const schema = clientCreateSchema;
type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

type ClientDetailActionsProps = {
  clientId: string;
  businessName: string;
  updatedAt: string;
  defaults: FormValues;
};

export function ClientDetailActions({
  clientId,
  businessName,
  updatedAt,
  defaults,
}: ClientDetailActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const { register, handleSubmit, formState, reset } = form;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await updateClient({ id: clientId, ...values });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/40 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">
          Last saved{" "}
          <span className="font-medium text-foreground">
            {formatDateTime(updatedAt)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
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
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="gap-2 rounded-full"
            disabled={pending}
            onClick={() => setArchiveOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDestructiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive client?"
        description={`Archive “${businessName}” (soft delete)? You will leave this page.`}
        confirmLabel="Archive"
        onConfirm={async () => {
          await deleteClient(clientId);
          router.push("/clients");
          router.refresh();
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-companyName">Business name</Label>
              <Input
                id="edit-companyName"
                placeholder="Acme Inc."
                autoComplete="organization"
                {...register("companyName")}
              />
              <FieldError message={formState.errors.companyName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Primary contact name</Label>
              <Input
                id="edit-name"
                placeholder="Jane Doe"
                autoComplete="name"
                {...register("name")}
              />
              <FieldError message={formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...register("email")} />
              <FieldError message={formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" {...register("phone")} />
              <FieldError message={formState.errors.phone?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea id="edit-address" rows={2} {...register("address")} />
              <FieldError message={formState.errors.address?.message} />
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
