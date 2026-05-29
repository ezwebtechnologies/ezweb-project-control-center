import type { Metadata } from "next";
import { listClients } from "@/app/actions/clients";
import { ClientsManager } from "@/components/clients/clients-manager";
import { requirePermission } from "@/lib/auth/access";

export const metadata: Metadata = {
  title: "Clients",
  alternates: { canonical: "/clients" },
};

export default async function ClientsPage() {
  await requirePermission("viewClients");
  const clients = await listClients();
  return <ClientsManager clients={clients} />;
}
