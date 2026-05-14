import type { Metadata } from "next";
import { Suspense } from "react";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Executive overview of projects, clients, quotation revenue, and profit.",
  alternates: { canonical: "/dashboard" },
};

async function DashboardData() {
  const data = await getDashboardData();
  return <DashboardView data={data} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
