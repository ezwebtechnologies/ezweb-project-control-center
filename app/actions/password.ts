"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/access";
import { getDefaultEmployeePassword } from "@/lib/auth/default-password";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  getSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { revalidateEmployees } from "@/lib/revalidate";
import {
  adminResetEmployeePasswordSchema,
  forcedPasswordChangeSchema,
  voluntaryPasswordChangeSchema,
} from "@/lib/validations";

export type PasswordActionState = { error: string } | null;

export async function changePasswordForced(
  _prev: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.mustChangePassword) redirect("/dashboard");

  const parsed = forcedPasswordChangeSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      error:
        flat.newPassword?.[0] ??
        flat.confirmPassword?.[0] ??
        "Enter a valid new password.",
    };
  }

  const defaultPassword = getDefaultEmployeePassword();
  if (parsed.data.newPassword === defaultPassword) {
    return {
      error: "Choose a different password than the default temporary password.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash, mustChangePassword: false },
  });

  const token = await createSessionToken({
    ...session,
    mustChangePassword: false,
  });
  await setSessionCookie(token);
  redirect("/dashboard");
}

export async function changePasswordVoluntary(
  _prev: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = voluntaryPasswordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      error:
        flat.currentPassword?.[0] ??
        flat.newPassword?.[0] ??
        flat.confirmPassword?.[0] ??
        "Check your passwords and try again.",
    };
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId, deletedAt: null },
    select: { passwordHash: true },
  });
  if (
    !user?.passwordHash ||
    !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))
  ) {
    return { error: "Current password is incorrect." };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { error: "New password must be different from your current password." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash, mustChangePassword: false },
  });

  const token = await createSessionToken({
    ...session,
    mustChangePassword: false,
  });
  await setSessionCookie(token);
  redirect("/profile?passwordUpdated=1");
}

export type ResetEmployeePasswordResult =
  | { ok: true; defaultPassword: string }
  | { ok: false; error: string };

export async function resetEmployeePassword(
  input: unknown
): Promise<ResetEmployeePasswordResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, error: "Only admins can reset employee passwords." };
  }

  const parsed = adminResetEmployeePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid employee." };
  }

  const employee = await prisma.employee.findFirst({
    where: { id: parsed.data.employeeId, deletedAt: null },
    select: { userId: true },
  });
  if (!employee?.userId) {
    return { ok: false, error: "This employee has no login account." };
  }

  const defaultPassword = getDefaultEmployeePassword();
  await prisma.user.update({
    where: { id: employee.userId },
    data: {
      passwordHash: await hashPassword(defaultPassword),
      mustChangePassword: true,
    },
  });

  revalidateEmployees();
  return { ok: true, defaultPassword };
}
