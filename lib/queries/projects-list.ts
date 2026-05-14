import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { repairLegacyProjectStatusesIfNeeded } from "@/lib/repair-legacy-project-status";

async function listProjectsDirectoryImpl() {
  await repairLegacyProjectStatusesIfNeeded();
  return prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      deadline: true,
      status: true,
      client: { select: { id: true, companyName: true, name: true } },
    },
  });
}

export const listProjectsDirectory = cache(listProjectsDirectoryImpl);
