export type Permissions = {
  viewPayments: boolean;
  viewClients: boolean;
  viewAllProjects: boolean;
};

export type AccessRole = "ADMIN" | "EMPLOYEE";

export type AccessContext = {
  role: AccessRole;
  permissions: Permissions;
};

export type NavPermission = "payments" | "clients" | "employees";

export function canAccessNav(
  ctx: AccessContext,
  requires: NavPermission | undefined
): boolean {
  if (ctx.role === "ADMIN") return true;
  switch (requires) {
    case "payments":
      return ctx.permissions.viewPayments;
    case "clients":
      return ctx.permissions.viewClients;
    case "employees":
      return false;
    default:
      return true;
  }
}
