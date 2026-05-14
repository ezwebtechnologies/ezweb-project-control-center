"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import type { ProjectLifecycleStage } from "@/lib/project-lifecycle";
import { projectStatusLabels } from "@/lib/labels";
import { BUILD_BUCKET_STAGES } from "@/lib/project-path";
import type { ClientUatPanelHandle } from "@/components/projects/client-uat-panel";
import type { BuildTaskRow } from "@/components/projects/project-build-tasks-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@prisma/client";

const RequirementsGatheringPanel = dynamic(
  () =>
    import("@/components/projects/requirements-gathering-panel").then(
      (m) => m.RequirementsGatheringPanel
    ),
  { ssr: true }
);

const ProposalPricingPanel = dynamic(
  () =>
    import("@/components/projects/proposal-pricing-panel").then(
      (m) => m.ProposalPricingPanel
    ),
  { ssr: true }
);

const AdvancePaymentPanel = dynamic(
  () =>
    import("@/components/projects/advance-payment-panel").then(
      (m) => m.AdvancePaymentPanel
    ),
  { ssr: true }
);

const ProjectBuildTasksPanel = dynamic(
  () =>
    import("@/components/projects/project-build-tasks-panel").then(
      (m) => m.ProjectBuildTasksPanel
    ),
  { ssr: true }
);

const ClientUatPanel = dynamic(
  () =>
    import("@/components/projects/client-uat-panel").then((m) => m.ClientUatPanel),
  { ssr: true }
);

const RevisionsPlaybookPanel = dynamic(
  () =>
    import("@/components/projects/revisions-playbook-panel").then(
      (m) => m.RevisionsPlaybookPanel
    ),
  { ssr: true }
);

const ProjectDeliveredPanel = dynamic(
  () =>
    import("@/components/projects/project-delivered-panel").then(
      (m) => m.ProjectDeliveredPanel
    ),
  { ssr: true }
);

type StageCopy = {
  title: string;
  subtitle: string;
  options: { title: string; detail: string }[];
};

const PANEL: Record<ProjectLifecycleStage, StageCopy> = {
  INITIAL_DISCUSSION: {
    title: "Kickoff",
    subtitle: "Align stakeholders before detailed discovery.",
    options: [
      { title: "Record drivers", detail: "Capture business goals and success measures." },
      { title: "Stakeholder map", detail: "List owners, SMEs, and decision makers." },
      { title: "Next checkpoint", detail: "Schedule the requirements workshop." },
    ],
  },
  REQUIREMENTS_GATHERING: {
    title: projectStatusLabels.REQUIREMENTS_GATHERING,
    subtitle: "Turn needs into clear, testable outcomes.",
    options: [],
  },
  PROPOSAL_APPROVED: {
    title: projectStatusLabels.PROPOSAL_APPROVED,
    subtitle: "",
    options: [],
  },
  ADVANCE_PAYMENT_RECEIVED: {
    title: projectStatusLabels.ADVANCE_PAYMENT_RECEIVED,
    subtitle: "Record the deposit, then continue into build.",
    options: [],
  },
  UI_UX_DESIGN: {
    title: "Build — design",
    subtitle: "Work scope tasks below; advance the path when everything is done.",
    options: [],
  },
  IN_DEVELOPMENT: {
    title: "Build — implementation",
    subtitle: "Work scope tasks below; advance the path when everything is done.",
    options: [],
  },
  INTERNAL_TESTING: {
    title: "Build — internal QA",
    subtitle: "Work scope tasks below; advance the path when everything is done.",
    options: [],
  },
  CLIENT_UAT: {
    title: projectStatusLabels.CLIENT_UAT,
    subtitle: "",
    options: [],
  },
  REVISIONS: {
    title: projectStatusLabels.REVISIONS,
    subtitle: "Confirm client approval on each UAT issue, then move to Project delivered.",
    options: [],
  },
  PROJECT_DELIVERED: {
    title: projectStatusLabels.PROJECT_DELIVERED,
    subtitle: "Finish hypercare, settle the balance, then mark the project completed.",
    options: [],
  },
  PROJECT_CLOSED: {
    title: "Completed",
    subtitle: "Formal closure and lessons captured.",
    options: [
      { title: "Financial close", detail: "Final invoices, PO closure, margin review." },
      { title: "Retrospective", detail: "What worked, what to standardise next time." },
      { title: "Archive artefacts", detail: "Store final assets in the system of record." },
    ],
  },
};

type Props = {
  stage: ProjectLifecycleStage;
  projectId?: string;
  requirementsGatheringData?: unknown;
  archived?: boolean;
  defaultQuotationRecipientEmail?: string | null;
  quotationTotal?: number;
  buildTasks?: BuildTaskRow[];
  clientUatData?: unknown;
  postDeliveryData?: unknown;
  contractBalance?: {
    contractTotal: number;
    advance: number;
    paidTowardContract: number;
    balanceDue: number;
  };
  projectPayments?: { id: string; amount: number; status: PaymentStatus; currency: string }[];
};

export function ProjectStageOptionsPanel({
  stage,
  projectId,
  requirementsGatheringData,
  archived = false,
  defaultQuotationRecipientEmail,
  quotationTotal = 0,
  buildTasks = [],
  clientUatData,
  postDeliveryData,
  contractBalance,
  projectPayments = [],
}: Props) {
  const copy = PANEL[stage] ?? PANEL.INITIAL_DISCUSSION;
  const showRequirementsWorkspace =
    (stage === "INITIAL_DISCUSSION" || stage === "REQUIREMENTS_GATHERING") &&
    Boolean(projectId);
  const playbookHeader =
    showRequirementsWorkspace ? PANEL.REQUIREMENTS_GATHERING : copy;
  const showProposalPricing =
    stage === "PROPOSAL_APPROVED" && Boolean(projectId);
  const showAdvancePayment =
    stage === "ADVANCE_PAYMENT_RECEIVED" && Boolean(projectId);
  const isBuildStage = (BUILD_BUCKET_STAGES as readonly ProjectLifecycleStage[]).includes(stage);
  const showClientUat = stage === "CLIENT_UAT" && Boolean(projectId);
  const showRevisions = stage === "REVISIONS" && Boolean(projectId);
  const showProjectDelivered = stage === "PROJECT_DELIVERED" && Boolean(projectId);
  const showClosedPlaybook = stage === "PROJECT_CLOSED" && Boolean(projectId);
  const clientUatPanelRef = useRef<ClientUatPanelHandle>(null);
  const [clientUatBusy, setClientUatBusy] = useState(false);

  const suggestedFocus = (
    <div>
      <p className="mb-3 text-xs font-medium text-muted-foreground">Suggested focus</p>
      <ul className="space-y-3">
        {copy.options.map((opt) => (
          <li
            key={opt.title}
            className={cn(
              "rounded-xl border border-border/40 bg-background/40 px-4 py-3 transition-colors",
              "hover:border-border/70 hover:bg-background/60"
            )}
          >
            <p className="text-sm font-semibold text-foreground">{opt.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Card className="border-border/50 bg-card/50 shadow-md backdrop-blur-md">
      <CardHeader className="space-y-1 border-b border-border/40 pb-4">
        {showClientUat ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <CardTitle className="text-lg sm:text-xl">{playbookHeader.title}</CardTitle>
              {playbookHeader.subtitle.trim() ? (
                <CardDescription className="text-sm leading-relaxed">{playbookHeader.subtitle}</CardDescription>
              ) : null}
            </div>
            {!archived ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={clientUatBusy}
                onClick={() => clientUatPanelRef.current?.toggleAddIssue()}
                className="shrink-0 gap-1.5 self-start rounded-lg sm:self-auto"
              >
                <Plus className="size-4" aria-hidden />
                Add issue
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <CardTitle className="text-lg sm:text-xl">{playbookHeader.title}</CardTitle>
            {playbookHeader.subtitle.trim() ? (
              <CardDescription className="text-sm leading-relaxed">{playbookHeader.subtitle}</CardDescription>
            ) : null}
          </>
        )}
      </CardHeader>
      <CardContent className="pt-5">
        {showRequirementsWorkspace ? (
          <RequirementsGatheringPanel
            projectId={projectId!}
            initialData={requirementsGatheringData}
            archived={archived}
          />
        ) : showProposalPricing ? (
          <ProposalPricingPanel
            projectId={projectId!}
            initialData={requirementsGatheringData}
            archived={archived}
            defaultRecipientEmail={defaultQuotationRecipientEmail}
          />
        ) : showAdvancePayment ? (
          <AdvancePaymentPanel
            projectId={projectId!}
            quotationTotal={quotationTotal}
            archived={archived}
          />
        ) : isBuildStage && projectId ? (
          <ProjectBuildTasksPanel
            projectId={projectId!}
            tasks={buildTasks}
            archived={archived}
          />
        ) : showClientUat ? (
          <ClientUatPanel
            ref={clientUatPanelRef}
            projectId={projectId!}
            clientUatData={clientUatData}
            archived={archived}
            onBusyChange={setClientUatBusy}
          />
        ) : showRevisions ? (
          <RevisionsPlaybookPanel
            projectId={projectId!}
            clientUatData={clientUatData}
            postDeliveryData={postDeliveryData}
            archived={archived}
          />
        ) : showProjectDelivered ? (
          <ProjectDeliveredPanel
            projectId={projectId!}
            clientUatData={clientUatData}
            postDeliveryData={postDeliveryData}
            balance={
              contractBalance ?? {
                contractTotal: 0,
                advance: 0,
                paidTowardContract: 0,
                balanceDue: 0,
              }
            }
            payments={projectPayments}
            archived={archived}
          />
        ) : showClosedPlaybook ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            This project is marked completed. Financial and delivery closeout should already be
            reflected in Payments and the path above.
          </p>
        ) : (
          suggestedFocus
        )}
      </CardContent>
    </Card>
  );
}
