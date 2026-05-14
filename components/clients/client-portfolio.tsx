import Link from "next/link";
import {
  Building2,
  CreditCard,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import type { PaymentStatus, ProjectStatus } from "@prisma/client";
import { coerceProjectStatus } from "@/lib/project-lifecycle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import { paymentStatusLabels, projectStatusLabels } from "@/lib/labels";

export type ClientPortfolioData = {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string | null;
  address: string | null;
  projects: {
    id: string;
    name: string;
    status: ProjectStatus;
    progress: number;
  }[];
  payments: {
    id: string;
    amount: unknown;
    currency: string;
    invoiceNumber: string | null;
    dueDate: Date | string | null;
    status: PaymentStatus;
  }[];
};

function businessInitials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export function ClientPortfolio({ client }: { client: ClientPortfolioData }) {
  const projectCount = client.projects.length;
  const paymentCount = client.payments.length;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-sidebar-primary/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 size-56 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="flex gap-5">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-sidebar-primary/25 to-sidebar-primary/5 text-lg font-semibold tracking-tight text-sidebar-primary shadow-inner sm:size-20 sm:text-xl"
              aria-hidden
            >
              {businessInitials(client.companyName)}
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Building2 className="size-3.5 text-sidebar-primary" aria-hidden />
                Business
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {client.companyName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span className="font-medium text-foreground/90">
                    {client.name}
                  </span>
                  <span className="text-muted-foreground/80">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    {client.email}
                  </span>
                </span>
                {client.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    {client.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
            <div className="flex gap-2">
              <div className="rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-center shadow-sm backdrop-blur-sm">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Projects
                </p>
                <p className="text-xl font-semibold tabular-nums">{projectCount}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-center shadow-sm backdrop-blur-sm">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Payments
                </p>
                <p className="text-xl font-semibold tabular-nums">{paymentCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border/50 bg-card/50 shadow-sm backdrop-blur-md lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact & location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3 rounded-xl border border-border/40 bg-background/30 p-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="truncate font-medium">{client.email}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/40 bg-background/30 p-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{client.phone || "—"}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/40 bg-background/30 p-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="whitespace-pre-wrap font-medium leading-relaxed">
                  {client.address || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 shadow-sm backdrop-blur-md lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Projects</CardTitle>
            <FolderKanban className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-2">
            {client.projects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/50 bg-muted/10 py-8 text-center text-sm text-muted-foreground">
                No projects yet — link work from the Projects area.
              </p>
            ) : (
              client.projects.map((p) => {
                const stage = coerceProjectStatus(String(p.status));
                return (
                <div
                  key={p.id}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-background/25 px-4 py-3 transition-colors hover:border-border/70 hover:bg-background/45"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {projectStatusLabels[stage]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                      <div
                        className="h-full rounded-full bg-sidebar-primary/80 transition-all group-hover:bg-sidebar-primary"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <Badge
                      variant="secondary"
                      className="tabular-nums text-[10px] font-semibold"
                    >
                      {p.progress}%
                    </Badge>
                  </div>
                </div>
              );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 shadow-sm backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Recent payments</CardTitle>
          <CreditCard className="size-4 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent>
          {client.payments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/50 bg-muted/10 py-8 text-center text-sm text-muted-foreground">
              No payments recorded for this account.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {client.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/25 px-4 py-3 transition-colors hover:border-border/70 hover:bg-background/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {p.invoiceNumber ?? "Invoice"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(p.dueDate)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(p.amount as string | number, p.currency)}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {paymentStatusLabels[p.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
