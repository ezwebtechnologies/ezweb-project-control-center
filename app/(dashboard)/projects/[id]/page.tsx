import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries/project-detail";
import { isEmployeeAssignedToProject } from "@/lib/queries/projects-list";
import { requireUser } from "@/lib/auth/access";
import { redirect } from "next/navigation";
import { parseRequirementsGatheringData } from "@/lib/requirements-gathering";
import {
  computeQuotationGrandTotal,
  mergeRequirementsPricing,
} from "@/lib/requirements-pricing";
import { computeProjectBalanceSnapshot } from "@/lib/project-balance";
import { ProjectDetailActions } from "@/components/projects/project-detail-actions";
import { ProjectLifecyclePath } from "@/components/projects/project-lifecycle-path";
import { ProjectStageOptionsPanel } from "@/components/projects/project-stage-options-panel";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { coerceProjectStatus } from "@/lib/project-lifecycle";
import { timed } from "@/lib/perf-log";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // Hits Next.js Data Cache (and is deduped with the page render via React.cache).
  const project = await getProject(id);
  if (!project) return { title: "Project" };
  return {
    title: project.name,
    description: `${project.name} — ${project.client.companyName}.`,
    alternates: { canonical: `/projects/${id}` },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const user = await requireUser();

  // Single fetch — every downstream consumer (lifecycle path, stage panel,
  // actions) reads from this one payload. React.cache + Next data cache
  // guarantees no duplicate DB round trips even if children call getProject().
  const project = await timed(`page.getProject ${id}`, () => getProject(id));
  if (!project) notFound();

  // Employees without "view all projects" may only open assigned projects.
  if (!user.permissions.viewAllProjects) {
    const assigned = user.employeeId
      ? await isEmployeeAssignedToProject(user.employeeId, id)
      : false;
    if (!assigned) redirect("/projects");
  }

  const lifecycleStage = coerceProjectStatus(String(project.status));
  const archived = Boolean(project.archivedAt);

  const actionsPayload = {
    id: project.id,
    clientId: project.clientId,
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    deadline: project.deadline,
    tags: project.tags,
  };

  const rg = parseRequirementsGatheringData(project.requirementsGatheringData);
  const quotationTotal = computeQuotationGrandTotal({
    pages: rg.pages,
    checklist: rg.checklist,
    pricing: mergeRequirementsPricing(rg.pricing),
  });
  const contractBalance = computeProjectBalanceSnapshot({
    quotationTotal,
    advanceAmount: Number(project.advancePaymentAmount ?? 0),
    payments: project.payments,
  });
  const projectPayments = project.payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    status: p.status,
    currency: p.currency,
  }));
  const buildTasks = project.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/projects"
          prefetch
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "gap-1 rounded-full px-2 text-muted-foreground hover:text-foreground",
          })}
        >
          ← All projects
        </Link>
        <Link
          href={`/payments?project=${encodeURIComponent(id)}`}
          prefetch={false}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "gap-1 rounded-full px-2 text-muted-foreground hover:text-foreground",
          })}
        >
          Payments
        </Link>
      </div>

      <Card className="border-border/50 bg-card/60 shadow-md ring-1 ring-border/30 backdrop-blur-md">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 flex-1 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {project.name}
              </h2>
              {/* clients prop omitted on purpose: loaded lazily on dialog open */}
              <ProjectDetailActions
                toolbar
                className="shrink-0 pt-0.5"
                project={actionsPayload}
              />
            </div>

            <div className="min-w-0">
              {project.description?.trim() ? (
                <p className="text-pretty whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">No description yet.</p>
              )}
            </div>
          </div>

          <ProjectLifecyclePath
            embedded
            embeddedDense
            projectId={project.id}
            status={lifecycleStage}
            archived={archived}
          />
        </CardContent>
      </Card>

      <ProjectStageOptionsPanel
        stage={lifecycleStage}
        projectId={project.id}
        requirementsGatheringData={project.requirementsGatheringData}
        archived={archived}
        defaultQuotationRecipientEmail={project.client.email}
        quotationTotal={quotationTotal}
        buildTasks={buildTasks}
        clientUatData={project.clientUatData}
        postDeliveryData={project.postDeliveryData}
        contractBalance={contractBalance}
        projectPayments={projectPayments}
      />
    </div>
  );
}
