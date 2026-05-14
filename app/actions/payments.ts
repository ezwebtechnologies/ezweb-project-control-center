"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paymentCreateSchema, paymentUpdateSchema } from "@/lib/validations";

function parseDate(v: string | null | undefined) {
  if (!v || v.trim() === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createPayment(input: unknown) {
  const raw = paymentCreateSchema.parse(input);
  await prisma.payment.create({
    data: {
      clientId: raw.clientId,
      projectId: raw.projectId ?? null,
      amount: raw.amount,
      currency: raw.currency,
      status: raw.status,
      invoiceNumber: raw.invoiceNumber ?? null,
      paymentDate: parseDate(raw.paymentDate ?? null),
      dueDate: parseDate(raw.dueDate ?? null),
      notes: raw.notes ?? null,
    },
  });
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  if (raw.projectId) {
    revalidatePath(`/projects/${raw.projectId}`);
  }
}

export async function updatePayment(input: unknown) {
  const raw = paymentUpdateSchema.parse(input);
  const { id, paymentDate, dueDate, ...data } = raw;
  await prisma.payment.update({
    where: { id, deletedAt: null },
    data: {
      ...data,
      projectId: raw.projectId ?? null,
      invoiceNumber: raw.invoiceNumber ?? null,
      paymentDate: parseDate(paymentDate ?? null),
      dueDate: parseDate(dueDate ?? null),
      notes: raw.notes ?? null,
    },
  });
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  if (raw.projectId) {
    revalidatePath(`/projects/${raw.projectId}`);
  }
}

export async function deletePayment(id: string) {
  const row = await prisma.payment.findFirst({
    where: { id, deletedAt: null },
    select: { projectId: true },
  });
  await prisma.payment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  if (row?.projectId) {
    revalidatePath(`/projects/${row.projectId}`);
  }
}

export async function markPaymentReceived(
  paymentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = z.string().uuid().safeParse(paymentId);
  if (!id.success) {
    return { ok: false, error: "Invalid payment." };
  }
  const row = await prisma.payment.findFirst({
    where: { id: id.data, deletedAt: null },
    select: { status: true, paymentDate: true, projectId: true },
  });
  if (!row) {
    return { ok: false, error: "Payment not found." };
  }
  if (row.status === "PAID") {
    return { ok: true };
  }
  await prisma.payment.update({
    where: { id: id.data },
    data: {
      status: "PAID",
      paymentDate: row.paymentDate ?? new Date(),
    },
  });
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  if (row.projectId) {
    revalidatePath(`/projects/${row.projectId}`);
  }
  return { ok: true };
}
