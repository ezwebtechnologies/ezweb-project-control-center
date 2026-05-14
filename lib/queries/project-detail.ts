import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";
import { timed } from "@/lib/perf-log";

/**
 * Single source of truth for the project-detail page.
 *
 * Cold-path optimization: `relationLoadStrategy: "join"` (Prisma 5.7+) tells
 * Prisma to fetch the project + client + tasks + payments in ONE SQL statement
 * (LATERAL joins), so the entire payload is one network round trip to Postgres
 * instead of four sequential queries. On Neon this typically cuts cold reads
 * from 1–5 s to ~150–300 ms.
 *
 * The select is also tightly scoped — only fields the page or any stage panel
 * actually consumes are pulled, keeping payload + serialization minimal.
 */
const projectDetailSelect = {
  id: true,
  clientId: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  deadline: true,
  tags: true,
  archivedAt: true,
  requirementsGatheringData: true,
  clientUatData: true,
  postDeliveryData: true,
  advancePaymentAmount: true,
  client: { select: { companyName: true, email: true } },
  tasks: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, status: true },
  },
  payments: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, amount: true, status: true, currency: true },
  },
} satisfies Prisma.ProjectSelect;

export type ProjectDetailPayload = Prisma.ProjectGetPayload<{
  select: typeof projectDetailSelect;
}>;

/**
 * Per-process memo of the unstable_cache wrapper for each project id.
 * Building the closure once per id (instead of per call) keeps the Data Cache
 * key registry stable and avoids closure churn under load.
 */
const fetcherById = new Map<string, () => Promise<ProjectDetailPayload | null>>();

function getCachedFetcher(id: string) {
  let fn = fetcherById.get(id);
  if (!fn) {
    fn = unstable_cache(
      () =>
        timed(`db.getProject ${id}`, () =>
          prisma.project.findFirst({
            relationLoadStrategy: "join",
            where: { id, deletedAt: null },
            select: projectDetailSelect,
          })
        ),
      ["project-detail", id],
      { tags: [cacheTags.project(id)], revalidate: 60 }
    );
    fetcherById.set(id, fn);
  }
  return fn;
}

/**
 * Request-scoped dedup. `generateMetadata` + page render + every nested
 * server component that needs project data all share one Promise per request.
 */
export const getProject = cache(
  async (id: string): Promise<ProjectDetailPayload | null> =>
    timed(`getProject ${id}`, () => getCachedFetcher(id)())
);
