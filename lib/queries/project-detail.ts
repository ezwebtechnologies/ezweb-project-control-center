import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { repairLegacyProjectStatusesIfNeeded } from "@/lib/repair-legacy-project-status";
import type { Prisma } from "@prisma/client";

const projectDetailSelect = {
  id: true,
  clientId: true,
  name: true,
  description: true,
  notes: true,
  status: true,
  priority: true,
  startDate: true,
  deadline: true,
  progress: true,
  tags: true,
  requirementsGatheringData: true,
  clientUatData: true,
  postDeliveryData: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  advancePaymentAmount: true,
  tasks: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, status: true, sortOrder: true },
  },
  client: { select: { id: true, companyName: true, name: true, email: true } },
  payments: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, amount: true, status: true, currency: true },
  },
} satisfies Prisma.ProjectSelect;

export type ProjectDetailPayload = Prisma.ProjectGetPayload<{
  select: typeof projectDetailSelect;
}>;

async function getProjectImpl(
  id: string
): Promise<ProjectDetailPayload | null> {
  await repairLegacyProjectStatusesIfNeeded();
  return prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: projectDetailSelect,
  });
}

export const getProject = cache(getProjectImpl);
