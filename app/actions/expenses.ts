"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidateExpense } from "@/lib/revalidate";
import { expenseCreateSchema } from "@/lib/validations";

function parseIncurredDate(v: string) {
  const d = new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createExpense(input: unknown) {
  const raw = expenseCreateSchema.parse(input);
  const incurredAt = parseIncurredDate(raw.incurredAt);
  if (!incurredAt) {
    throw new Error("Invalid incurred date.");
  }
  await prisma.expense.create({
    data: {
      amount: raw.amount,
      currency: raw.currency,
      description: raw.description.trim(),
      incurredAt,
    },
  });
  revalidateExpense();
}

export async function deleteExpense(id: string) {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    throw new Error("Invalid expense.");
  }
  const row = await prisma.expense.findFirst({
    where: { id: parsed.data, deletedAt: null },
    select: { id: true },
  });
  if (!row) {
    throw new Error("Expense not found.");
  }
  await prisma.expense.update({
    where: { id: parsed.data },
    data: { deletedAt: new Date() },
  });
  revalidateExpense();
}
