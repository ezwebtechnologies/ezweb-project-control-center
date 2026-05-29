"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/access";
import { getDefaultEmployeePassword } from "@/lib/auth/default-password";
import { hashPassword } from "@/lib/auth/password";
import { listEmployeesDirectory } from "@/lib/queries/employees-directory";
import { revalidateEmployees } from "@/lib/revalidate";
import {
  employeeAccessUpdateSchema,
  employeeCreateSchema,
} from "@/lib/validations";

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

type AccessFlags = {
  role: "ADMIN" | "EMPLOYEE";
  canViewPayments: boolean;
  canViewClients: boolean;
  canViewAllProjects: boolean;
};

// Admins implicitly have full access; persist the flags as true for clarity.
function normalizeAccess(input: {
  accountRole: "ADMIN" | "EMPLOYEE";
  canViewPayments: boolean;
  canViewClients: boolean;
  canViewAllProjects: boolean;
}): AccessFlags {
  if (input.accountRole === "ADMIN") {
    return {
      role: "ADMIN",
      canViewPayments: true,
      canViewClients: true,
      canViewAllProjects: true,
    };
  }
  return {
    role: "EMPLOYEE",
    canViewPayments: input.canViewPayments,
    canViewClients: input.canViewClients,
    canViewAllProjects: input.canViewAllProjects,
  };
}

export type CreateEmployeeResult = { ok: true } | { ok: false; error: string };

export type EnableEmployeeLoginResult =
  | { ok: true; defaultPassword: string }
  | { ok: false; error: string };

export type UpdateEmployeeAccessResult =
  | { ok: true }
  | { ok: false; error: string };

export async function listEmployees() {
  return listEmployeesDirectory();
}

export async function createEmployee(
  input: unknown
): Promise<CreateEmployeeResult> {
  await requireAdmin();

  const parsed = employeeCreateSchema.safeParse(input);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.email?.[0] ??
      parsed.error.flatten().fieldErrors.name?.[0] ??
      "Invalid employee details.";
    return { ok: false, error: msg };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase().trim();
  const name = data.name.trim();
  const access = normalizeAccess(data);

  const existingUser = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });
  if (existingUser) {
    return {
      ok: false,
      error: "An account with this email already exists. Use a different email.",
    };
  }

  const passwordHash = await hashPassword(getDefaultEmployeePassword());

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          mustChangePassword: true,
          role: access.role,
          canViewPayments: access.canViewPayments,
          canViewClients: access.canViewClients,
          canViewAllProjects: access.canViewAllProjects,
        },
      });

      await tx.employee.create({
        data: {
          name,
          email,
          department: emptyToNull(data.department),
          role: emptyToNull(data.role),
          notes: emptyToNull(data.notes),
          userId: user.id,
        },
      });
    });
  } catch {
    return { ok: false, error: "Could not create employee. Try again." };
  }

  revalidateEmployees();
  return { ok: true };
}

export async function updateEmployeeAccess(
  input: unknown
): Promise<UpdateEmployeeAccessResult> {
  await requireAdmin();

  const parsed = employeeAccessUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid access settings." };
  }

  const employee = await prisma.employee.findFirst({
    where: { id: parsed.data.employeeId, deletedAt: null },
    select: { userId: true },
  });
  if (!employee?.userId) {
    return { ok: false, error: "This employee has no login account." };
  }

  const access = normalizeAccess(parsed.data);
  await prisma.user.update({
    where: { id: employee.userId },
    data: {
      role: access.role,
      canViewPayments: access.canViewPayments,
      canViewClients: access.canViewClients,
      canViewAllProjects: access.canViewAllProjects,
    },
  });

  revalidateEmployees();
  return { ok: true };
}

export async function enableEmployeeLogin(
  employeeId: string
): Promise<EnableEmployeeLoginResult> {
  await requireAdmin();

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
    select: { id: true, name: true, email: true, userId: true },
  });

  if (!employee) {
    return { ok: false, error: "Employee not found." };
  }
  if (employee.userId) {
    return { ok: false, error: "This employee already has login access." };
  }

  const email = employee.email?.toLowerCase().trim();
  if (!email) {
    return {
      ok: false,
      error: "Add an email to this employee before enabling login.",
    };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });
  if (existingUser) {
    return {
      ok: false,
      error: "An account with this email already exists.",
    };
  }

  const defaultPassword = getDefaultEmployeePassword();
  const passwordHash = await hashPassword(defaultPassword);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: employee.name.trim(),
          passwordHash,
          mustChangePassword: true,
          role: "EMPLOYEE",
          canViewPayments: false,
          canViewClients: false,
          canViewAllProjects: false,
        },
      });
      await tx.employee.update({
        where: { id: employee.id },
        data: { userId: user.id },
      });
    });
  } catch {
    return { ok: false, error: "Could not enable login. Try again." };
  }

  revalidateEmployees();
  return { ok: true, defaultPassword };
}

export async function deleteEmployee(id: string) {
  await requireAdmin();

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
    select: { userId: true },
  });

  if (!employee) return;

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id },
      data: { deletedAt: now },
    });
    if (employee.userId) {
      await tx.user.update({
        where: { id: employee.userId },
        data: { deletedAt: now },
      });
    }
  });

  revalidateEmployees();
}
