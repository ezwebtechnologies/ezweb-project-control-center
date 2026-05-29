import type { Metadata } from "next";
import { listEmployees } from "@/app/actions/employees";
import { EmployeesManager } from "@/components/employees/employees-manager";
import { getDefaultEmployeePassword } from "@/lib/auth/default-password";

export const metadata: Metadata = {
  title: "Employees",
  description: "Team directory and employee records.",
  alternates: { canonical: "/employees" },
};

export default async function EmployeesPage() {
  const [employees, defaultEmployeePassword] = await Promise.all([
    listEmployees(),
    Promise.resolve(getDefaultEmployeePassword()),
  ]);

  const rows = employees.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    department: e.department,
    role: e.role,
    userId: e.userId,
    pendingPasswordReset: e.user?.mustChangePassword ?? false,
  }));

  return (
    <EmployeesManager
      employees={rows}
      defaultEmployeePassword={defaultEmployeePassword}
    />
  );
}
