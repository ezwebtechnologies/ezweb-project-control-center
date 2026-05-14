import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";

const fetchProjectsDirectory = unstable_cache(
  async () =>
    prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        deadline: true,
        status: true,
        client: { select: { id: true, companyName: true, name: true } },
      },
    }),
  ["projects-directory"],
  { tags: [cacheTags.projectsList], revalidate: 60 }
);

export const listProjectsDirectory = cache(fetchProjectsDirectory);
