import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";

const fetchClientsDirectory = unstable_cache(
  async () =>
    prisma.client.findMany({
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
    }),
  ["clients-directory"],
  { tags: [cacheTags.clientsList], revalidate: 60 }
);

export const listClientsDirectory = cache(fetchClientsDirectory);
