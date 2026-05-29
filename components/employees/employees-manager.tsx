"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { KeyRound, Plus, Trash2, UserPlus } from "lucide-react";
import {
  createEmployee,
  deleteEmployee,
  enableEmployeeLogin,
} from "@/app/actions/employees";
import { resetEmployeePassword } from "@/app/actions/password";
import { employeeCreateSchema } from "@/lib/validations";
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
import { PasswordInput } from "@/components/ui/password-input";
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

type EmployeeRow = {
  id: string;
  name: string;
  email: string | null;
  department: string | null;
  role: string | null;
  userId: string | null;
  pendingPasswordReset: boolean;
};

const schema = employeeCreateSchema;
type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function EmployeesManager({
  employees,
  defaultEmployeePassword,
}: {
  employees: EmployeeRow[];
  defaultEmployeePassword: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [resetTarget, setResetTarget] = useState<EmployeeRow | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [enableTarget, setEnableTarget] = useState<EmployeeRow | null>(null);
  const [enablePassword, setEnablePassword] = useState<string | null>(null);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();
  const [enablePending, startEnableTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: "",
      email: "",
      department: "",
      role: "",
      notes: "",
    }),
    []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { register, handleSubmit, formState, reset } = form;

  function openCreate() {
    reset(defaultValues);
    setFormError(null);
    setOpen(true);
  }

  function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await createEmployee(values);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setOpen(false);
      reset(defaultValues);
    });
  }

  function openResetPassword(employee: EmployeeRow) {
    setResetTarget(employee);
    setResetPassword(null);
    setResetError(null);
  }

  function confirmEnableLogin() {
    if (!enableTarget) return;
    setEnableError(null);
    startEnableTransition(async () => {
      const result = await enableEmployeeLogin(enableTarget.id);
      if (!result.ok) {
        setEnableError(result.error);
        return;
      }
      setEnablePassword(result.defaultPassword);
    });
  }

  function confirmResetPassword() {
    if (!resetTarget) return;
    setResetError(null);
    startResetTransition(async () => {
      const result = await resetEmployeePassword({ employeeId: resetTarget.id });
      if (!result.ok) {
        setResetError(result.error);
        return;
      }
      setResetPassword(result.defaultPassword);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            New employees get the default password and must set a new one on
            first sign-in at{" "}
            <span className="font-medium text-foreground">/login</span>.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="w-full gap-2 rounded-full sm:w-auto"
        >
          <Plus className="size-4" />
          New employee
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md">
        {employees.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No employees yet. Add your first team member.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-muted/30">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">App access</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id} className="border-border/40">
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.department ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.role ?? "—"}
                  </TableCell>
                  <TableCell>
                    {e.userId ? (
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          Can sign in
                        </Badge>
                        {e.pendingPasswordReset ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 dark:text-amber-400"
                          >
                            Must reset password
                          </Badge>
                        ) : null}
                      </div>
                    ) : e.email ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-600 dark:text-amber-400"
                      >
                        No login yet
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!e.userId && e.email ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full"
                          aria-label={`Enable login for ${e.name}`}
                          onClick={() => {
                            setEnableTarget(e);
                            setEnablePassword(null);
                            setEnableError(null);
                          }}
                        >
                          <UserPlus className="size-4" />
                        </Button>
                      ) : null}
                      {e.userId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full"
                          aria-label={`Reset password for ${e.name}`}
                          onClick={() => openResetPassword(e)}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full text-destructive hover:text-destructive"
                        aria-label={`Remove ${e.name}`}
                        onClick={() => setDeleteTarget(e)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
            <DialogTitle>Create employee</DialogTitle>
            <p className="text-sm text-muted-foreground">
              A login account is created automatically. Share the default
              password below; they must choose a new password on first sign-in.
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">Name</Label>
              <Input id="emp-name" autoComplete="name" {...register("name")} />
              <FieldError message={formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email">Email (login)</Label>
              <Input
                id="emp-email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              <FieldError message={formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label>Default password (temporary)</Label>
              <PasswordInput
                readOnly
                value={defaultEmployeePassword}
                aria-readonly
                className="bg-muted/40"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Configured via{" "}
                <code className="text-[11px]">DEFAULT_EMPLOYEE_PASSWORD</code>{" "}
                in your environment.
              </p>
            </div>
            {formError ? (
              <p className="text-xs text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emp-department">Department</Label>
                <Input id="emp-department" {...register("department")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-role">Role</Label>
                <Input id="emp-role" {...register("role")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-notes">Notes</Label>
              <Textarea id="emp-notes" rows={2} {...register("notes")} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={enableTarget !== null}
        onOpenChange={(next) => {
          if (!next) {
            setEnableTarget(null);
            setEnablePassword(null);
            setEnableError(null);
          }
        }}
      >
        <DialogContent className="border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable login</DialogTitle>
            {enableTarget ? (
              <p className="text-sm text-muted-foreground">
                Create a sign-in account for{" "}
                <span className="font-medium text-foreground">
                  {enableTarget.name}
                </span>{" "}
                ({enableTarget.email}).
              </p>
            ) : null}
          </DialogHeader>
          {enablePassword ? (
            <div className="space-y-3">
              <Label>Temporary password</Label>
              <PasswordInput
                readOnly
                value={enablePassword}
                aria-readonly
                className="bg-muted/40"
              />
              <p className="text-xs text-muted-foreground">
                They sign in at /login with this password, then must choose a
                new password.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Default password:{" "}
              <span className="font-mono text-foreground">
                {defaultEmployeePassword}
              </span>
            </p>
          )}
          {enableError ? (
            <p className="text-xs text-destructive" role="alert">
              {enableError}
            </p>
          ) : null}
          <DialogFooter>
            {enablePassword ? (
              <Button
                type="button"
                onClick={() => {
                  setEnableTarget(null);
                  setEnablePassword(null);
                }}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEnableTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={enablePending}
                  onClick={confirmEnableLogin}
                >
                  {enablePending ? "Enabling…" : "Enable login"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetTarget !== null}
        onOpenChange={(next) => {
          if (!next) {
            setResetTarget(null);
            setResetPassword(null);
            setResetError(null);
          }
        }}
      >
        <DialogContent className="border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            {resetTarget ? (
              <p className="text-sm text-muted-foreground">
                Reset login for <span className="font-medium text-foreground">{resetTarget.name}</span>{" "}
                to the default password. They must set a new password on next
                sign-in.
              </p>
            ) : null}
          </DialogHeader>
          {resetPassword ? (
            <div className="space-y-3">
              <Label>New temporary password</Label>
              <PasswordInput
                readOnly
                value={resetPassword}
                aria-readonly
                className="bg-muted/40"
              />
              <p className="text-xs text-muted-foreground">
                Share this with the employee. It works at{" "}
                <span className="font-medium text-foreground">/login</span> until
                they choose a new password.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Default password:{" "}
              <span className="font-mono text-foreground">
                {defaultEmployeePassword}
              </span>
            </p>
          )}
          {resetError ? (
            <p className="text-xs text-destructive" role="alert">
              {resetError}
            </p>
          ) : null}
          <DialogFooter>
            {resetPassword ? (
              <Button
                type="button"
                onClick={() => {
                  setResetTarget(null);
                  setResetPassword(null);
                }}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={resetPending}
                  onClick={confirmResetPassword}
                >
                  {resetPending ? "Resetting…" : "Reset to default"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget ? (
        <ConfirmDestructiveDialog
          open
          onOpenChange={(next) => !next && setDeleteTarget(null)}
          title="Remove employee?"
          description={`Remove “${deleteTarget.name}” from the directory?`}
          onConfirm={async () => {
            await deleteEmployee(deleteTarget.id);
          }}
        />
      ) : null}
    </div>
  );
}
