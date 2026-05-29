import type { Metadata } from "next";
import { Suspense } from "react";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { getCurrentUser } from "@/lib/auth/access";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Executive overview of projects, clients, quotation revenue, and profit.",
  alternates: { canonical: "/dashboard" },
};

async function DashboardData() {
  const [data, user] = await Promise.all([getDashboardData(), getCurrentUser()]);
  return (
    <DashboardView
      data={data}
      showFinancials={user?.permissions.viewPayments ?? false}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
