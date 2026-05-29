import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";
import type { Prisma } from "@prisma/client";

const PROJECT_DIRECTORY_SELECT = {
  id: true,
  name: true,
  deadline: true,
  status: true,
  client: { select: { id: true, companyName: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  assignees: { select: { id: true, name: true } },
} satisfies Prisma.ProjectSelect;

const fetchProjectsDirectory = unstable_cache(
  async () =>
    prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: PROJECT_DIRECTORY_SELECT,
    }),
  ["projects-directory"],
  { tags: [cacheTags.projectsList], revalidate: 60 }
);

export const listProjectsDirectory = cache(fetchProjectsDirectory);

/** Projects assigned to a specific employee (for non-admin limited views). */
export async function listProjectsForEmployee(employeeId: string) {
  return prisma.project.findMany({
    where: { deletedAt: null, assignees: { some: { id: employeeId } } },
    orderBy: { updatedAt: "desc" },
    select: PROJECT_DIRECTORY_SELECT,
  });
}

export async function isEmployeeAssignedToProject(
  employeeId: string,
  projectId: string
): Promise<boolean> {
  const count = await prisma.project.count({
    where: {
      id: projectId,
      deletedAt: null,
      assignees: { some: { id: employeeId } },
    },
  });
  return count > 0;
}
