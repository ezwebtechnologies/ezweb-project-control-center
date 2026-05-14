import type { Metadata } from "next";
import { listClients } from "@/app/actions/clients";
import { ClientsManager } from "@/components/clients/clients-manager";

export const metadata: Metadata = {
  title: "Clients",
  alternates: { canonical: "/clients" },
};

export default async function ClientsPage() {
  const clients = await listClients();
  return <ClientsManager clients={clients} />;
}
