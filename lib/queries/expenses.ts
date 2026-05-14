import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type ExpenseListRow = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  incurredAt: string;
  createdAt: string;
};

async function listExpensesImpl(): Promise<ExpenseListRow[]> {
  const rows = await prisma.expense.findMany({
    where: { deletedAt: null },
    orderBy: { incurredAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      description: true,
      incurredAt: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    currency: r.currency,
    description: r.description,
    incurredAt: r.incurredAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

export const listExpenses = cache(listExpensesImpl);
