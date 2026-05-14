"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { DashboardOverviewCharts as ChartsType } from "@/components/dashboard/dashboard-overview-charts";

const Charts = dynamic(
  () =>
    import("@/components/dashboard/dashboard-overview-charts").then(
      (m) => m.DashboardOverviewCharts
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded-xl bg-muted/30" />
    ),
  }
);

export function LazyDashboardCharts(
  props: ComponentProps<typeof ChartsType>
) {
  return <Charts {...props} />;
}
