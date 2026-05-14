"use client";

import { BarChart3, LayoutList } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import {
  projectStageShortLabels,
  type ProjectLifecycleStage,
} from "@/lib/project-lifecycle";

type FinanceTone = "muted" | "accent" | "danger" | "success" | "loss";

type FinanceRow = { label: string; value: number; tone: FinanceTone };

type PipelineRow = { status: ProjectLifecycleStage; count: number };

const FINANCE_FILL: Record<FinanceTone, string> = {
  muted: "var(--chart-fin-muted)",
  accent: "var(--chart-fin-accent)",
  danger: "var(--chart-fin-danger)",
  success: "var(--chart-fin-success)",
  loss: "var(--chart-fin-loss)",
};

const PIPELINE_FILLS = [
  "var(--chart-pipeline-1)",
  "var(--chart-pipeline-2)",
  "var(--chart-pipeline-3)",
  "var(--chart-pipeline-4)",
  "var(--chart-pipeline-5)",
] as const;

function axisMoneyCompact(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(n) ? n : 0);
}

function chartCardClassName() {
  return [
    "relative overflow-hidden rounded-2xl border border-border/50",
    "bg-gradient-to-br from-card via-card to-muted/[0.35]",
    "shadow-[0_1px_0_0_oklch(1_0_0/6%)_inset] dark:shadow-[0_1px_0_0_oklch(1_0_0/4%)_inset]",
    "shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.03]",
    "dark:from-card dark:via-card dark:to-muted/15 dark:shadow-black/25 dark:ring-white/[0.06]",
    "gap-1.5 py-2",
  ].join(" ");
}

export function DashboardOverviewCharts({
  finance,
  pipeline,
}: {
  finance: FinanceRow[];
  pipeline: PipelineRow[];
}) {
  const financeData = finance.map((r) => ({
    label: r.label,
    amount: Math.abs(r.value),
    actual: r.value,
    tone: r.tone,
  }));

  const pipelineData = pipeline.map((row, i) => ({
    label: projectStageShortLabels[row.status],
    count: row.count,
    fill: PIPELINE_FILLS[i % PIPELINE_FILLS.length]!,
  }));

  const financeHeight = 248;
  const pipelineChartHeight = 248;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className={chartCardClassName()}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45] dark:opacity-[0.35]"
          aria-hidden
          style={{
            background:
              "radial-gradient(120% 80% at 100% 0%, color-mix(in oklch, var(--sidebar-primary) 22%, transparent), transparent 62%), radial-gradient(90% 60% at 0% 100%, color-mix(in oklch, var(--muted-foreground) 8%, transparent), transparent 55%)",
          }}
        />
        <CardHeader className="relative space-y-0.5 px-3 pb-0 pt-3 sm:px-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Financial overview
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Quoted revenue, cash received on projects, expenses, and net profit.
              </CardDescription>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 shadow-sm backdrop-blur-sm">
              <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative px-2 pb-1 pt-0 sm:px-3 sm:pb-1">
          <div
            className="w-full"
            role="img"
            aria-label="Bar chart of financial metrics in Indian rupees"
          >
            <ResponsiveContainer width="100%" height={financeHeight}>
              <BarChart
                data={financeData}
                margin={{ top: 4, right: 6, left: 2, bottom: 36 }}
                barCategoryGap="32%"
              >
                <defs>
                  {financeData.map((row, i) => (
                    <linearGradient
                      key={row.label}
                      id={`fin-grad-${i}`}
                      x1="0"
                      y1="1"
                      x2="0"
                      y2="0"
                    >
                      <stop offset="0%" stopColor={FINANCE_FILL[row.tone]} stopOpacity={0.72} />
                      <stop offset="100%" stopColor={FINANCE_FILL[row.tone]} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="4 8"
                  stroke="var(--border)"
                  horizontal
                  vertical={false}
                />
                <XAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-24}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  type="number"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => axisMoneyCompact(Number(v))}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.14, radius: 8 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as (typeof financeData)[number];
                    return (
                      <div className="rounded-xl border border-border/60 bg-popover/95 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
                        <p className="font-medium leading-none text-foreground">{row.label}</p>
                        <p className="mt-1.5 tabular-nums text-muted-foreground">
                          {formatMoney(row.actual)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {financeData.map((row, i) => (
                    <Cell key={row.label} fill={`url(#fin-grad-${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className={chartCardClassName()}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.3]"
          aria-hidden
          style={{
            background:
              "radial-gradient(100% 70% at 0% 0%, color-mix(in oklch, var(--chart-pipeline-2) 18%, transparent), transparent 58%), radial-gradient(80% 50% at 100% 100%, color-mix(in oklch, var(--chart-pipeline-1) 14%, transparent), transparent 50%)",
          }}
        />
        <CardHeader className="relative space-y-0.5 px-3 pb-0 pt-3 sm:px-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Pipeline by stage
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Active projects grouped by lifecycle stage.
              </CardDescription>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/50 shadow-sm backdrop-blur-sm">
              <LayoutList className="size-4 text-muted-foreground" aria-hidden />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative px-2 pb-1 pt-0 sm:px-3 sm:pb-1">
          {pipelineData.length === 0 ? (
            <div className="flex min-h-[96px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No active projects</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground/90">
                Projects appear here once they are in the pipeline and not archived.
              </p>
            </div>
          ) : (
            <div
              className="w-full"
              role="img"
              aria-label="Bar chart of project counts by lifecycle stage"
            >
              <ResponsiveContainer width="100%" height={pipelineChartHeight}>
                <BarChart
                  data={pipelineData}
                  margin={{ top: 14, right: 6, left: 2, bottom: 36 }}
                  barCategoryGap="32%"
                >
                  <defs>
                    {pipelineData.map((row, i) => (
                      <linearGradient
                        key={`${row.label}-${i}`}
                        id={`pipe-grad-${i}`}
                        x1="0"
                        y1="1"
                        x2="0"
                        y2="0"
                      >
                        <stop offset="0%" stopColor={row.fill} stopOpacity={0.75} />
                        <stop offset="100%" stopColor={row.fill} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 8"
                    stroke="var(--border)"
                    horizontal
                    vertical={false}
                  />
                  <XAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-24}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    domain={[0, "dataMax"]}
                    tickCount={6}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.14, radius: 8 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload as (typeof pipelineData)[number];
                      return (
                        <div className="rounded-xl border border-border/60 bg-popover/95 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
                          <p className="font-medium leading-none text-foreground">{row.label}</p>
                          <p className="mt-1.5 tabular-nums text-muted-foreground">
                            {row.count} project{row.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    animationDuration={700}
                    animationEasing="ease-out"
                  >
                    {pipelineData.map((_, i) => (
                      <Cell key={i} fill={`url(#pipe-grad-${i})`} />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="top"
                      fill="var(--foreground)"
                      className="text-[10px] font-semibold tabular-nums"
                      style={{ fontSize: 10 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
