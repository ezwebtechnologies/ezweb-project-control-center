import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionRole } from "@/lib/auth/session";
import type { Permissions } from "@/lib/auth/permissions";

export type { Permissions } from "@/lib/auth/permissions";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  mustChangePassword: boolean;
  employeeId: string | null;
  permissions: Permissions;
};

const ADMIN_PERMISSIONS: Permissions = {
  viewPayments: true,
  viewClients: true,
  viewAllProjects: true,
};

/**
 * Resolves the signed-in user with fresh role + permissions from the database
 * (not the JWT), so permission changes by an admin take effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findFirst({
    where: { id: session.userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mustChangePassword: true,
      canViewPayments: true,
      canViewClients: true,
      canViewAllProjects: true,
      employee: { select: { id: true } },
    },
  });
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const permissions: Permissions = isAdmin
    ? ADMIN_PERMISSIONS
    : {
        viewPayments: user.canViewPayments,
        viewClients: user.canViewClients,
        viewAllProjects: user.canViewAllProjects,
      };

  return {
    id: user.id,
    email: user.email,
    name: user.name?.trim() || user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    employeeId: user.employee?.id ?? null,
    permissions,
  };
});

export function isAdmin(user: { role: SessionRole } | null): boolean {
  return user?.role === "ADMIN";
}

/** Returns the current user or redirects to login / change-password. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function requirePermission(
  permission: keyof Permissions
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.permissions[permission]) redirect("/dashboard");
  return user;
}
