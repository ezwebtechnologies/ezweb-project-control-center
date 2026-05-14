import { cache } from "react";
import { prisma } from "@/lib/prisma";

async function listClientsDirectoryImpl() {
  return prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { companyName: "asc" },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      phone: true,
      address: true,
      _count: {
        select: {
          projects: { where: { deletedAt: null } },
        },
      },
    },
  });
}

export const listClientsDirectory = cache(listClientsDirectoryImpl);
