import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";

const fetchEmployeesDirectory = unstable_cache(
  async () =>
    prisma.employee.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        userId: true,
        user: {
          select: { mustChangePassword: true },
        },
        createdAt: true,
      },
    }),
  [cacheTags.employeesList],
  { tags: [cacheTags.employeesList] }
);

export const listEmployeesDirectory = cache(fetchEmployeesDirectory);
