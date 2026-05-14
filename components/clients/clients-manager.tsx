"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Plus } from "lucide-react";
import { createClient } from "@/app/actions/clients";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardSearch } from "@/components/providers/dashboard-search-provider";

type ClientRow = {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string | null;
  address: string | null;
  _count: { projects: number };
};

const schema = clientCreateSchema;
type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function ClientsManager({ clients }: { clients: ClientRow[] }) {
  const { query } = useDashboardSearch();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: "",
      companyName: "",
      email: "",
      phone: "",
      address: "",
    }),
    []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  function openCreate() {
    form.reset(defaultValues);
    setOpen(true);
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await createClient(values);
      setOpen(false);
      form.reset(defaultValues);
    });
  }

  const { register, handleSubmit, formState } = form;

  const visibleClients = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(s) ||
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s)
    );
  }, [clients, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        </div>
        <Button
          onClick={openCreate}
          className="w-full shrink-0 gap-2 rounded-full sm:w-auto"
        >
          <Plus className="size-4" />
          New client
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md">
        {visibleClients.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {clients.length === 0 ? "No clients yet." : "No clients match your search."}
          </p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-muted/30">
              <TableHead className="font-semibold">Business name</TableHead>
              <TableHead className="font-semibold">Primary contact name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="text-right font-semibold">Projects</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleClients.map((c) => (
              <TableRow
                key={c.id}
                className="border-border/40 transition-colors hover:bg-muted/20"
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/clients/${c.id}`}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    {c.companyName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c._count.projects}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Business name</Label>
              <Input
                id="companyName"
                placeholder="Acme Inc."
                autoComplete="organization"
                {...register("companyName")}
              />
              <FieldError message={formState.errors.companyName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Primary contact name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                autoComplete="name"
                {...register("name")}
              />
              <FieldError message={formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              <FieldError message={formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              <FieldError message={formState.errors.phone?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} {...register("address")} />
              <FieldError message={formState.errors.address?.message} />
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
