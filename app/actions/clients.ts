"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { repairLegacyProjectStatusesIfNeeded } from "@/lib/repair-legacy-project-status";
import { clientCreateSchema, clientUpdateSchema } from "@/lib/validations";

export async function listClients() {
  return prisma.client.findMany({
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
  });
}

export async function getClient(id: string) {
  await repairLegacyProjectStatusesIfNeeded();
  return prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      projects: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
      },
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createClient(input: unknown) {
  const data = clientCreateSchema.parse(input);
  await prisma.client.create({ data });
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function updateClient(input: unknown) {
  const { id, ...data } = clientUpdateSchema.parse(input);
  await prisma.client.update({
    where: { id, deletedAt: null },
    data,
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteClient(id: string) {
  await prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
