"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { KeyRound, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import {
  createEmployee,
  deleteEmployee,
  enableEmployeeLogin,
  updateEmployeeAccess,
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
import { PageTitle } from "@/components/brand/page-title";
import { cn } from "@/lib/utils";

type AccountRole = "ADMIN" | "EMPLOYEE";

type EmployeeRow = {
  id: string;
  name: string;
  email: string | null;
  department: string | null;
  role: string | null;
  userId: string | null;
  pendingPasswordReset: boolean;
  accountRole: AccountRole | null;
  canViewPayments: boolean;
  canViewClients: boolean;
  canViewAllProjects: boolean;
  assignedProjectCount: number;
};

const schema = employeeCreateSchema;
type FormValues = z.infer<typeof schema>;

type AccessValue = {
  accountRole: AccountRole;
  canViewPayments: boolean;
  canViewClients: boolean;
  canViewAllProjects: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

const ACCESS_PRESETS: {
  id: string;
  label: string;
  canViewPayments: boolean;
  canViewClients: boolean;
  canViewAllProjects: boolean;
}[] = [
  // Sales: customers + projects, no payments.
  {
    id: "sales",
    label: "Sales",
    canViewPayments: false,
    canViewClients: true,
    canViewAllProjects: true,
  },
  // Developer: only their assigned projects.
  {
    id: "developer",
    label: "Developer",
    canViewPayments: false,
    canViewClients: false,
    canViewAllProjects: false,
  },
  // Manager: everything except admin/team management.
  {
    id: "manager",
    label: "Manager",
    canViewPayments: true,
    canViewClients: true,
    canViewAllProjects: true,
  },
];

const PRESET_DESCRIPTIONS: Record<string, string> = {
  sales: "Create customers and projects. No payments.",
  developer: "Only assigned projects. No clients or payments.",
  manager: "Clients, all projects, and payments.",
};

function permissionsMatchPreset(
  value: Pick<
    AccessValue,
    "canViewPayments" | "canViewClients" | "canViewAllProjects"
  >,
  preset: (typeof ACCESS_PRESETS)[number]
): boolean {
  return (
    value.canViewPayments === preset.canViewPayments &&
    value.canViewClients === preset.canViewClients &&
    value.canViewAllProjects === preset.canViewAllProjects
  );
}

function findMatchingPresetId(
  value: Pick<
    AccessValue,
    "canViewPayments" | "canViewClients" | "canViewAllProjects"
  >
): string | null {
  return (
    ACCESS_PRESETS.find((p) => permissionsMatchPreset(value, p))?.id ?? null
  );
}

function AccessControls({
  value,
  onChange,
  disabled,
  resetKey,
}: {
  value: AccessValue;
  onChange: (next: AccessValue) => void;
  disabled?: boolean;
  /** Remount preset selection when dialog opens for a different person. */
  resetKey?: string;
}) {
  const isAdmin = value.accountRole === "ADMIN";
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    setActivePreset(findMatchingPresetId(value));
  }, [resetKey]);

  const set = (patch: Partial<AccessValue>) => onChange({ ...value, ...patch });

  function applyPreset(preset: (typeof ACCESS_PRESETS)[number]) {
    setActivePreset(preset.id);
    set({
      canViewPayments: preset.canViewPayments,
      canViewClients: preset.canViewClients,
      canViewAllProjects: preset.canViewAllProjects,
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="space-y-2">
        <Label>Account role</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["EMPLOYEE", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (r === "ADMIN") {
                  set({
                    accountRole: "ADMIN",
                    canViewPayments: true,
                    canViewClients: true,
                    canViewAllProjects: true,
                  });
                  setActivePreset(null);
                } else {
                  set({
                    accountRole: "EMPLOYEE",
                    canViewPayments: false,
                    canViewClients: false,
                    canViewAllProjects: false,
                  });
                  setActivePreset(null);
                }
              }}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                value.accountRole === r
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {r === "ADMIN" ? "Admin" : "Employee"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {isAdmin
            ? "Admins have full access to everything, including payments and team management."
            : "Check only what this person should access. Nothing is enabled until you select it."}
        </p>
      </div>

      <div
        className={cn(
          "space-y-3 transition-opacity",
          isAdmin && "pointer-events-none opacity-50"
        )}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Quick presets
          </p>
          <p className="text-[11px] text-muted-foreground">
            Optional shortcut — checks the permissions below for you.
          </p>
          {ACCESS_PRESETS.map((preset) => (
            <AccessCheckRow
              key={preset.id}
              label={preset.label}
              description={PRESET_DESCRIPTIONS[preset.id]}
              checked={activePreset === preset.id}
              disabled={disabled || isAdmin}
              onCheckedChange={(checked) => {
                if (checked) applyPreset(preset);
                else if (activePreset === preset.id) setActivePreset(null);
              }}
            />
          ))}
        </div>

        <div className="border-t border-border/40 pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Permissions
          </p>
          <div className="space-y-1">
            <AccessCheckRow
              label="View payments & finances"
              description="Revenue, profit, balances and expenses."
              checked={value.canViewPayments}
              disabled={disabled || isAdmin}
              onCheckedChange={(c) => {
                setActivePreset(null);
                set({ canViewPayments: c });
              }}
            />
            <AccessCheckRow
              label="View clients"
              description="Client directory and contact details."
              checked={value.canViewClients}
              disabled={disabled || isAdmin}
              onCheckedChange={(c) => {
                setActivePreset(null);
                set({ canViewClients: c });
              }}
            />
            <AccessCheckRow
              label="View all projects"
              description="When off, they only see projects assigned to them."
              checked={value.canViewAllProjects}
              disabled={disabled || isAdmin}
              onCheckedChange={(c) => {
                setActivePreset(null);
                set({ canViewAllProjects: c });
              }}
            />
          </div>
        </div>

        {!isAdmin &&
        !value.canViewPayments &&
        !value.canViewClients &&
        !value.canViewAllProjects ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            No permissions selected — they will only see the dashboard shell.
            Assign them to projects so they can open those.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AccessCheckRow({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function EmployeesManager({
  employees,
  defaultEmployeePassword,
}: {
  employees: EmployeeRow[];
  defaultEmployeePassword: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [resetTarget, setResetTarget] = useState<EmployeeRow | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [enableTarget, setEnableTarget] = useState<EmployeeRow | null>(null);
  const [enablePassword, setEnablePassword] = useState<string | null>(null);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [accessTarget, setAccessTarget] = useState<EmployeeRow | null>(null);
  const [accessValue, setAccessValue] = useState<AccessValue | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();
  const [enablePending, startEnableTransition] = useTransition();
  const [accessPending, startAccessTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: "",
      email: "",
      department: "",
      role: "",
      notes: "",
      accountRole: "EMPLOYEE",
      canViewPayments: false,
      canViewClients: false,
      canViewAllProjects: false,
    }),
    []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { register, handleSubmit, formState, reset, watch, setValue } = form;

  const accessFromForm: AccessValue = {
    accountRole: watch("accountRole"),
    canViewPayments: watch("canViewPayments"),
    canViewClients: watch("canViewClients"),
    canViewAllProjects: watch("canViewAllProjects"),
  };

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
      router.refresh();
    });
  }

  function openAccess(employee: EmployeeRow) {
    setAccessTarget(employee);
    setAccessError(null);
    setAccessValue({
      accountRole: employee.accountRole ?? "EMPLOYEE",
      canViewPayments: employee.canViewPayments,
      canViewClients: employee.canViewClients,
      canViewAllProjects: employee.canViewAllProjects,
    });
  }

  function confirmAccess() {
    if (!accessTarget || !accessValue) return;
    setAccessError(null);
    startAccessTransition(async () => {
      const result = await updateEmployeeAccess({
        employeeId: accessTarget.id,
        ...accessValue,
      });
      if (!result.ok) {
        setAccessError(result.error);
        return;
      }
      setAccessTarget(null);
      setAccessValue(null);
      router.refresh();
    });
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
      router.refresh();
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
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageTitle
          title="Employees"
          description="Create admins or employees and control exactly what each person can see. New accounts use the default password and must reset it on first sign-in."
        />
        <Button
          onClick={openCreate}
          className="w-full gap-2 rounded-full sm:w-auto"
        >
          <Plus className="size-4" />
          New person
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
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Access</TableHead>
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
                  <TableCell>
                    {e.userId ? (
                      <Badge
                        variant={e.accountRole === "ADMIN" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {e.accountRole === "ADMIN" ? "Admin" : "Employee"}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {e.role ?? "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {e.userId ? (
                      <AccessSummary employee={e} />
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
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                            aria-label={`Edit access for ${e.name}`}
                            onClick={() => openAccess(e)}
                          >
                            <ShieldCheck className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                            aria-label={`Reset password for ${e.name}`}
                            onClick={() => {
                              setResetTarget(e);
                              setResetPassword(null);
                              setResetError(null);
                            }}
                          >
                            <KeyRound className="size-4" />
                          </Button>
                        </>
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
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New person</DialogTitle>
            <p className="text-sm text-muted-foreground">
              A login account is created automatically with the default password.
              They must choose a new password on first sign-in.
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
            </div>

            <AccessControls
              resetKey={open ? "create" : "closed"}
              value={accessFromForm}
              onChange={(next) => {
                setValue("accountRole", next.accountRole);
                setValue("canViewPayments", next.canViewPayments);
                setValue("canViewClients", next.canViewClients);
                setValue("canViewAllProjects", next.canViewAllProjects);
              }}
            />

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
                <Label htmlFor="emp-role">Job title</Label>
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
        open={accessTarget !== null}
        onOpenChange={(next) => {
          if (!next) {
            setAccessTarget(null);
            setAccessValue(null);
            setAccessError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-border/60 bg-popover/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit access</DialogTitle>
            {accessTarget ? (
              <p className="text-sm text-muted-foreground">
                Control what{" "}
                <span className="font-medium text-foreground">
                  {accessTarget.name}
                </span>{" "}
                can see in the portal.
              </p>
            ) : null}
          </DialogHeader>
          {accessValue ? (
            <AccessControls
              resetKey={accessTarget?.id}
              value={accessValue}
              onChange={setAccessValue}
            />
          ) : null}
          {accessError ? (
            <p className="text-xs text-destructive" role="alert">
              {accessError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAccessTarget(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={accessPending} onClick={confirmAccess}>
              {accessPending ? "Saving…" : "Save access"}
            </Button>
          </DialogFooter>
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
                They sign in at /login with this password, then must choose a new
                password.
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
                Reset login for{" "}
                <span className="font-medium text-foreground">
                  {resetTarget.name}
                </span>{" "}
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
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function AccessSummary({ employee }: { employee: EmployeeRow }) {
  if (employee.accountRole === "ADMIN") {
    return (
      <Badge variant="secondary" className="text-[10px]">
        Full access
      </Badge>
    );
  }

  const tags: string[] = [];
  if (employee.canViewPayments) tags.push("Payments");
  if (employee.canViewClients) tags.push("Clients");
  tags.push(
    employee.canViewAllProjects
      ? "All projects"
      : `Assigned (${employee.assignedProjectCount})`
  );

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge key={t} variant="outline" className="text-[10px]">
          {t}
        </Badge>
      ))}
      {employee.pendingPasswordReset ? (
        <Badge
          variant="outline"
          className="text-[10px] text-amber-600 dark:text-amber-400"
        >
          Must reset
        </Badge>
      ) : null}
    </div>
  );
}
