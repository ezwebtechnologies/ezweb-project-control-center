import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";

export type ExpenseListRow = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  incurredAt: string;
  createdAt: string;
};

const fetchExpenses = unstable_cache(
  async (): Promise<ExpenseListRow[]> => {
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
  },
  ["expenses-list"],
  { tags: [cacheTags.expenses], revalidate: 60 }
);

export const listExpenses = cache(fetchExpenses);
