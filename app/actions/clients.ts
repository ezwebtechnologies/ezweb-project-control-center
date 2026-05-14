"use server";

import { prisma } from "@/lib/prisma";
import { getClientDetail } from "@/lib/queries/client-detail";
import { listClientsDirectory } from "@/lib/queries/clients-directory";
import { revalidateClient } from "@/lib/revalidate";
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
  revalidateClient();
}

export async function updateClient(input: unknown) {
  const { id, ...data } = clientUpdateSchema.parse(input);
  await prisma.client.update({
    where: { id, deletedAt: null },
    data,
  });
  revalidateClient(id);
}

export async function deleteClient(id: string) {
  await prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidateClient(id);
}
