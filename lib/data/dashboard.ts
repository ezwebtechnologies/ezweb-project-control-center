import { cache } from "react";
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
import { repairLegacyProjectStatusesIfNeeded } from "@/lib/repair-legacy-project-status";

type DeadlineRow = {
  id: string;
  name: string;
  deadline: Date | null;
  companyName: string;
  status_text: string;
};

async function getDashboardDataImpl() {
  await repairLegacyProjectStatusesIfNeeded();

  const now = new Date();
  const activeWhere = { deletedAt: null };

  const [
    totalProjects,
    totalClients,
    quotationRows,
    advanceAgg,
    paidOnProjectsAgg,
    expensesAgg,
    statusRows,
    deadlineRows,
  ] = await Promise.all([
    prisma.project.count({
      where: { ...activeWhere, archivedAt: null },
    }),
    prisma.client.count({
      where: activeWhere,
    }),
    prisma.project.findMany({
      where: { ...activeWhere, archivedAt: null },
      select: { requirementsGatheringData: true },
    }),
    prisma.project.aggregate({
      where: activeWhere,
      _sum: { advancePaymentAmount: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...activeWhere,
        status: "PAID",
        project: { deletedAt: null },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...activeWhere },
      _sum: { amount: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: { ...activeWhere, archivedAt: null },
      _count: { _all: true },
    }),
    prisma.$queryRaw<DeadlineRow[]>`
        SELECT
          p.id,
          p.name,
          p.deadline,
          c."companyName" AS "companyName",
          p.status::text AS "status_text"
        FROM "Project" p
        INNER JOIN "Client" c ON c.id = p."clientId"
        WHERE p."deletedAt" IS NULL
          AND p."archivedAt" IS NULL
          AND p.deadline IS NOT NULL
          AND p.deadline >= ${now}
        ORDER BY p.deadline ASC
        LIMIT 6
      `,
    ]);

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

  const advanceTotal = Number(advanceAgg._sum.advancePaymentAmount ?? 0);
  const paidOnProjectsTotal = Number(paidOnProjectsAgg._sum.amount ?? 0);
  const expensesTotal = Number(expensesAgg._sum.amount ?? 0);
  const totalReceivedFromProjects =
    Math.round((advanceTotal + paidOnProjectsTotal) * 100) / 100;
  const profitNet = Math.round((totalReceivedFromProjects - expensesTotal) * 100) / 100;

  const byCoercedStatus = new Map<ProjectLifecycleStage, number>();
  for (const row of statusRows) {
    const stage = coerceProjectStatus(row.status);
    byCoercedStatus.set(
      stage,
      (byCoercedStatus.get(stage) ?? 0) + row._count._all
    );
  }
  const pipelineByStatus = PROJECT_STAGE_ORDER.filter(
    (s) => (byCoercedStatus.get(s) ?? 0) > 0
  ).map((status) => ({
    status,
    count: byCoercedStatus.get(status) ?? 0,
  }));

  const upcomingDeadlines = deadlineRows.map((r) => ({
    id: r.id,
    name: r.name,
    deadline: r.deadline,
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

export const getDashboardData = cache(getDashboardDataImpl);
