import { unstable_cache } from "next/cache";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseRequirementsGatheringData } from "@/lib/requirements-gathering";
import {
  computeQuotationGrandTotal,
  mergeRequirementsPricing,
} from "@/lib/requirements-pricing";
import {
  PROJECT_STAGE_ORDER,
  coerceProjectStatus,
  type ProjectLifecycleStage,
} from "@/lib/project-lifecycle";
import { cacheTags } from "@/lib/cache-tags";

type ScalarsRow = {
  total_projects: bigint;
  total_clients: bigint;
  advance_total: string | null;
  paid_total: string | null;
  expense_total: string | null;
};

type StatusRow = { status: string; cnt: bigint };

type DeadlineRow = {
  id: string;
  name: string;
  deadline: Date | null;
  companyName: string;
  status_text: string;
};

type QuotationRow = { requirementsGatheringData: Prisma.JsonValue | null };

async function fetchDashboardRaw(now: Date) {
  const [scalars, statusRows, deadlineRows, quotationRows] = await Promise.all([
    prisma.$queryRaw<ScalarsRow[]>`
      SELECT
        (SELECT COUNT(*) FROM "Project"
          WHERE "deletedAt" IS NULL AND "archivedAt" IS NULL)            AS total_projects,
        (SELECT COUNT(*) FROM "Client"
          WHERE "deletedAt" IS NULL)                                     AS total_clients,
        (SELECT COALESCE(SUM("advancePaymentAmount"), 0) FROM "Project"
          WHERE "deletedAt" IS NULL)                                     AS advance_total,
        (SELECT COALESCE(SUM(p."amount"), 0)
           FROM "Payment" p
           JOIN "Project" pr ON pr.id = p."projectId"
          WHERE p."deletedAt" IS NULL
            AND p."status" = 'PAID'
            AND pr."deletedAt" IS NULL)                                  AS paid_total,
        (SELECT COALESCE(SUM("amount"), 0) FROM "Expense"
          WHERE "deletedAt" IS NULL)                                     AS expense_total
    `,
    prisma.$queryRaw<StatusRow[]>`
      SELECT status::text AS status, COUNT(*)::bigint AS cnt
        FROM "Project"
       WHERE "deletedAt" IS NULL AND "archivedAt" IS NULL
       GROUP BY status
    `,
    prisma.$queryRaw<DeadlineRow[]>`
      SELECT
        p.id, p.name, p.deadline,
        c."companyName" AS "companyName",
        p.status::text  AS "status_text"
      FROM "Project" p
      INNER JOIN "Client" c ON c.id = p."clientId"
      WHERE p."deletedAt" IS NULL
        AND p."archivedAt" IS NULL
        AND p.deadline IS NOT NULL
        AND p.deadline >= ${now}
      ORDER BY p.deadline ASC
      LIMIT 6
    `,
    prisma.$queryRaw<QuotationRow[]>`
      SELECT "requirementsGatheringData"
        FROM "Project"
       WHERE "deletedAt" IS NULL AND "archivedAt" IS NULL
    `,
  ]);

  return { scalars: scalars[0], statusRows, deadlineRows, quotationRows };
}

async function getDashboardDataImpl() {
  const now = new Date();
  const { scalars, statusRows, deadlineRows, quotationRows } =
    await fetchDashboardRaw(now);

  const totalProjects = Number(scalars?.total_projects ?? 0);
  const totalClients = Number(scalars?.total_clients ?? 0);
  const advanceTotal = Number(scalars?.advance_total ?? 0);
  const paidOnProjectsTotal = Number(scalars?.paid_total ?? 0);
  const expensesTotal = Number(scalars?.expense_total ?? 0);

  let totalQuotation = 0;
  for (const row of quotationRows) {
    const base = parseRequirementsGatheringData(row.requirementsGatheringData);
    totalQuotation += computeQuotationGrandTotal({
      pages: base.pages,
      checklist: base.checklist,
      pricing: mergeRequirementsPricing(base.pricing),
    });
  }
  totalQuotation = Math.round(totalQuotation * 100) / 100;

  const totalReceivedFromProjects =
    Math.round((advanceTotal + paidOnProjectsTotal) * 100) / 100;
  const profitNet =
    Math.round((totalReceivedFromProjects - expensesTotal) * 100) / 100;

  const byCoercedStatus = new Map<ProjectLifecycleStage, number>();
  for (const row of statusRows) {
    const stage = coerceProjectStatus(row.status);
    byCoercedStatus.set(stage, (byCoercedStatus.get(stage) ?? 0) + Number(row.cnt));
  }
  const pipelineByStatus = PROJECT_STAGE_ORDER.filter(
    (s) => (byCoercedStatus.get(s) ?? 0) > 0
  ).map((status) => ({ status, count: byCoercedStatus.get(status) ?? 0 }));

  const upcomingDeadlines = deadlineRows.map((r) => ({
    id: r.id,
    name: r.name,
    deadline: r.deadline ? new Date(r.deadline).toISOString() : null,
    status: coerceProjectStatus(r.status_text),
    client: { companyName: r.companyName },
  }));

  return {
    totalProjects,
    totalClients,
    totalRevenue: totalQuotation,
    profitNet,
    financeChart: [
      { label: "Quoted revenue", value: totalQuotation, tone: "muted" as const },
      {
        label: "Received on projects",
        value: totalReceivedFromProjects,
        tone: "accent" as const,
      },
      { label: "Expenses", value: expensesTotal, tone: "danger" as const },
      {
        label: "Profit",
        value: profitNet,
        tone: profitNet < 0 ? ("loss" as const) : ("success" as const),
      },
    ],
    pipelineByStatus,
    upcomingDeadlines,
  };
}

const cachedGetDashboardData = unstable_cache(
  getDashboardDataImpl,
  ["dashboard-overview"],
  { tags: [cacheTags.dashboard], revalidate: 60 }
);

export const getDashboardData = cache(cachedGetDashboardData);
