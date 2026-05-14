"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getClientDetail } from "@/lib/queries/client-detail";
import { listClientsDirectory } from "@/lib/queries/clients-directory";
import { clientCreateSchema, clientUpdateSchema } from "@/lib/validations";

export async function listClients() {
  return listClientsDirectory();
}

export async function getClient(id: string) {
  return getClientDetail(id);
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
