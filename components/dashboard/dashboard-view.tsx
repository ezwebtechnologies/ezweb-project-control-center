import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CreditCard,
  FolderKanban,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatRelative } from "@/lib/format";
import { projectStatusLabels } from "@/lib/labels";
import type { ProjectLifecycleStage } from "@/lib/project-lifecycle";
import { LazyDashboardCharts } from "@/components/dashboard/lazy-charts";

type FinanceChartRow = {
  label: string;
  value: number;
  tone: "muted" | "accent" | "danger" | "success" | "loss";
};

type DashboardPayload = {
  totalProjects: number;
  totalClients: number;
  totalRevenue: number;
  profitNet: number;
  financeChart: FinanceChartRow[];
  pipelineByStatus: { status: ProjectLifecycleStage; count: number }[];
  upcomingDeadlines: {
    id: string;
    name: string;
    deadline: string | null;
    status: ProjectLifecycleStage;
    client: { companyName: string };
  }[];
};

type MetricKey = "totalProjects" | "totalClients" | "totalRevenue" | "profitNet";

const METRICS: {
  key: MetricKey;
  title: string;
  icon: typeof FolderKanban;
  money?: boolean;
}[] = [
  { key: "totalProjects", title: "Total projects", icon: FolderKanban },
  { key: "totalClients", title: "Total clients", icon: Building2 },
  { key: "totalRevenue", title: "Revenue", icon: CreditCard, money: true },
  { key: "profitNet", title: "Profit", icon: TrendingUp, money: true },
];

export function DashboardView({ data }: { data: DashboardPayload }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-sidebar-primary" aria-hidden />
            Overview
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Control center
          </h1>
        </div>
        <Link
          href="/projects"
          prefetch
          className={buttonVariants({
            variant: "outline",
            className:
              "shrink-0 gap-2 rounded-full border-border/60 bg-background/40 backdrop-blur-md",
          })}
        >
          Open pipeline
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => {
          const raw = data[m.key] as number;
          const value = m.money ? formatMoney(raw) : raw;
          const Icon = m.icon;
          return (
            <Card
              key={m.title}
              className="border-border/50 bg-card/50 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {m.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">
                  {value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
          </div>
          <CalendarClock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {data.upcomingDeadlines.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              prefetch={false}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-2 transition-colors hover:border-border/70 hover:bg-background/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.client.companyName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium tabular-nums">
                  {formatRelative(p.deadline)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {projectStatusLabels[p.status]}
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <LazyDashboardCharts
        finance={data.financeChart}
        pipeline={data.pipelineByStatus}
      />
    </div>
  );
}
