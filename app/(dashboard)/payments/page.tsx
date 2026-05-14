import type { Metadata } from "next";
import { PaymentsWorkspace } from "@/components/payments/payments-workspace";
import { listExpenses } from "@/lib/queries/expenses";
import { listPaymentsWorkspaceProjects } from "@/lib/queries/payments-workspace";

export const metadata: Metadata = {
  title: "Payments",
  description:
    "Review quotation total, advance, balance due, and mark project-linked payments as received so projects can close.",
  keywords: ["payments", "invoices", "balance due", "MuleSoft delivery", "project control center"],
  alternates: { canonical: "/payments" },
  openGraph: {
    title: "Payments | Control center",
    description:
      "Review quotation total, advance, balance due, and mark project-linked payments as received so projects can close.",
    url: "/payments",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Payments | Control center",
    description:
      "Review quotation total, advance, balance due, and mark project-linked payments as received so projects can close.",
  },
};

type PageProps = {
  searchParams: Promise<{ project?: string; view?: string }>;
};

export default async function PaymentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const projectQuery = typeof sp.project === "string" ? sp.project.trim() : "";
  const viewRaw = typeof sp.view === "string" ? sp.view.trim().toLowerCase() : "";
  const projects = await listPaymentsWorkspaceProjects();
  const activeProjectId =
    projectQuery && projects.some((p) => p.id === projectQuery) ? projectQuery : null;
  const activeView =
    !activeProjectId && viewRaw === "expenses" ? ("expenses" as const) : ("projects" as const);
  const expenses =
    !activeProjectId && activeView === "expenses" ? await listExpenses() : [];

  return (
    <div className="mx-auto w-full max-w-6xl pb-12 pt-2">
      <PaymentsWorkspace
        projects={JSON.parse(JSON.stringify(projects))}
        activeProjectId={activeProjectId}
        activeView={activeView}
        expenses={JSON.parse(JSON.stringify(expenses))}
      />
    </div>
  );
}
