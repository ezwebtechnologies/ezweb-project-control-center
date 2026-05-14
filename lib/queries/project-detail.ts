import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";

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

const fetchProject = (id: string) =>
  unstable_cache(
    () =>
      prisma.project.findFirst({
        where: { id, deletedAt: null },
        select: projectDetailSelect,
      }),
    ["project-detail", id],
    { tags: [cacheTags.project(id)], revalidate: 60 }
  )();

export const getProject = cache(
  async (id: string): Promise<ProjectDetailPayload | null> => fetchProject(id)
);
