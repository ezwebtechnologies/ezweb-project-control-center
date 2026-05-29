import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getClient } from "@/app/actions/clients";
import { ClientDetailActions } from "@/components/clients/client-detail-actions";
import { ClientPortfolio } from "@/components/clients/client-portfolio";
import { buttonVariants } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/access";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) return { title: "Client" };
  return {
    title: client.companyName,
    description: `${client.companyName} — ${client.name}. Client portfolio and activity.`,
    alternates: { canonical: `/clients/${id}` },
  };
}

export default async function ClientDetailPage({ params }: PageProps) {
  await requirePermission("viewClients");
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const updatedAtIso =
    typeof client.updatedAt === "string"
      ? client.updatedAt
      : new Date(client.updatedAt).toISOString();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/clients"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "gap-2 rounded-full",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Clients
        </Link>
      </div>

      <ClientPortfolio client={client} />

      <ClientDetailActions
        key={updatedAtIso}
        clientId={client.id}
        businessName={client.companyName}
        updatedAt={updatedAtIso}
        defaults={{
          name: client.name,
          companyName: client.companyName,
          email: client.email,
          phone: client.phone ?? "",
          address: client.address ?? "",
        }}
      />
    </div>
  );
}
