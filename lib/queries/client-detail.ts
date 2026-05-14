import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";

const clientDetailSelect = {
  id: true,
  name: true,
  companyName: true,
  email: true,
  phone: true,
  address: true,
  updatedAt: true,
  projects: {
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" as const },
    select: {
      id: true,
      name: true,
      status: true,
      progress: true,
    },
  },
  payments: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      amount: true,
      currency: true,
      invoiceNumber: true,
      dueDate: true,
      status: true,
    },
  },
} satisfies Prisma.ClientSelect;

export type ClientDetailRecord = Prisma.ClientGetPayload<{
  select: typeof clientDetailSelect;
}>;

const fetchClient = (id: string) =>
  unstable_cache(
    () =>
      prisma.client.findFirst({
        where: { id, deletedAt: null },
        select: clientDetailSelect,
      }),
    ["client-detail", id],
    { tags: [cacheTags.client(id)], revalidate: 60 }
  )();

export const getClientDetail = cache(
  async (id: string): Promise<ClientDetailRecord | null> => fetchClient(id)
);
