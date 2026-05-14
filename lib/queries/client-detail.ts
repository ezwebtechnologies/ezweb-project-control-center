import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { repairLegacyProjectStatusesIfNeeded } from "@/lib/repair-legacy-project-status";

const clientDetailInclude = {
  projects: {
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" as const },
  },
  payments: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 10,
  },
} satisfies Prisma.ClientInclude;

export type ClientDetailRecord = Prisma.ClientGetPayload<{
  include: typeof clientDetailInclude;
}>;

async function getClientDetailImpl(
  id: string
): Promise<ClientDetailRecord | null> {
  await repairLegacyProjectStatusesIfNeeded();
  return prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: clientDetailInclude,
  });
}

export const getClientDetail = cache(getClientDetailImpl);
