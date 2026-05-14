import { cache } from "react";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeProjectBalanceSnapshot } from "@/lib/project-balance";
import { parseRequirementsGatheringData } from "@/lib/requirements-gathering";
import {
  computeQuotationGrandTotal,
  mergeRequirementsPricing,
} from "@/lib/requirements-pricing";

export type PaymentsWorkspacePaymentRow = {
  id: string;
  amount: number;
  status: PaymentStatus;
  currency: string;
  invoiceNumber: string | null;
  dueDate: string | null;
  paymentDate: string | null;
  notes: string | null;
  createdAt: string;
};

export type PaymentsWorkspaceProject = {
  id: string;
  clientId: string;
  name: string;
  archived: boolean;
  clientLabel: string;
  quotationTotal: number;
  balance: ReturnType<typeof computeProjectBalanceSnapshot>;
  payments: PaymentsWorkspacePaymentRow[];
};

async function listPaymentsWorkspaceProjectsImpl(): Promise<PaymentsWorkspaceProject[]> {
  const rows = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      clientId: true,
      name: true,
      archivedAt: true,
      advancePaymentAmount: true,
      requirementsGatheringData: true,
      client: { select: { companyName: true, name: true } },
      payments: {
        where: { deletedAt: null },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          amount: true,
          status: true,
          currency: true,
          invoiceNumber: true,
          dueDate: true,
          paymentDate: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const base = parseRequirementsGatheringData(row.requirementsGatheringData);
    const quotationTotal = computeQuotationGrandTotal({
      pages: base.pages,
      checklist: base.checklist,
      pricing: mergeRequirementsPricing(base.pricing),
    });
    const balance = computeProjectBalanceSnapshot({
      quotationTotal,
      advanceAmount: Number(row.advancePaymentAmount ?? 0),
      payments: row.payments,
    });
    const clientLabel =
      row.client.companyName?.trim() || row.client.name?.trim() || "Client";
    return {
      id: row.id,
      clientId: row.clientId,
      name: row.name,
      archived: Boolean(row.archivedAt),
      clientLabel,
      quotationTotal,
      balance,
      payments: row.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        currency: p.currency,
        invoiceNumber: p.invoiceNumber,
        dueDate: p.dueDate?.toISOString() ?? null,
        paymentDate: p.paymentDate?.toISOString() ?? null,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  });
}

export const listPaymentsWorkspaceProjects = cache(
  listPaymentsWorkspaceProjectsImpl
);
