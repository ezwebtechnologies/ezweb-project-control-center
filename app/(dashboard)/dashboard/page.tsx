import type { Metadata } from "next";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Executive overview of projects, clients, quotation revenue, and profit.",
  alternates: { canonical: "/dashboard" },
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardView data={data} />;
}
