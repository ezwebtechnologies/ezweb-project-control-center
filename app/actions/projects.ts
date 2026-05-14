"use server";

import { prisma } from "@/lib/prisma";
import { listProjectsDirectory } from "@/lib/queries/projects-list";
import { revalidateProject } from "@/lib/revalidate";
import { formatMoney } from "@/lib/format";
import {
  type ProjectLifecycleStage,
  INITIAL_LIFECYCLE_STAGE,
  coerceProjectStatus,
  computeProjectPriority,
  nextLifecycleStage,
  progressForStage,
} from "@/lib/project-lifecycle";
import { parseRequirementsGatheringData } from "@/lib/requirements-gathering";
import {
  mergeRequirementsPricing,
  computeRequirementsQuoteLines,
  computeRequirementsQuoteTotal,
  computeQuotationGrandTotal,
  quotationDiscountApplied,
} from "@/lib/requirements-pricing";
import {
  projectCreateStrictSchema,
  projectUpdateSchema,
  requirementsGatheringAdvanceSchema,
  proposalPricingSaveSchema,
  sendQuotationEmailSchema,
  advancePaymentSubmitSchema,
  projectTaskStatusUpdateSchema,
  clientUatPayloadSchema,
  revisionApprovalsSaveSchema,
  postDeliveryHypercareSaveSchema,
} from "@/lib/validations";
import { buildQuotationEmailHtml } from "@/lib/quotation-email-html";
import { sendTransactionalHtmlEmail } from "@/lib/send-transactional-email";
import { isAllowedLifecycleStage, BUILD_BUCKET_STAGES } from "@/lib/project-path";
import { seedBuildTasksFromRequirements } from "@/lib/seed-build-tasks-from-requirements";
import {
  parseClientUatData,
  sanitizeClientUatIssues,
  isClientUatComplete,
} from "@/lib/client-uat";
import {
  mergePostDeliveryWithIssues,
  parsePostDeliveryData,
  allRevisionsApproved,
  resolveHypercareState,
  isHypercareFullyDone,
  revisionApprovalsForSave,
  sanitizeHypercare,
} from "@/lib/post-delivery";
import { computeProjectBalanceSnapshot, isBalanceSettled } from "@/lib/project-balance";
import { Prisma, type $Enums } from "@prisma/client";

function toDbProjectStatus(stage: ProjectLifecycleStage): $Enums.ProjectStatus {
  return stage as unknown as $Enums.ProjectStatus;
}

function parseDate(v: string | null | undefined) {
  if (!v || v.trim() === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function listProjects() {
  return listProjectsDirectory();
}

export async function createProject(input: unknown) {
  const raw = projectCreateStrictSchema.parse(input);
  const deadline = parseDate(raw.deadline ?? null);
  const startDate = parseDate(raw.startDate ?? null);
  const priority = computeProjectPriority(deadline);
  await prisma.project.create({
    data: {
      clientId: raw.clientId,
      name: raw.name,
      description: raw.description ?? null,
      startDate,
      deadline,
      status: toDbProjectStatus(INITIAL_LIFECYCLE_STAGE),
      priority,
      progress: progressForStage(INITIAL_LIFECYCLE_STAGE),
      tags: raw.tags,
    } as Prisma.ProjectUncheckedCreateInput,
  });
  revalidateProject();
}

export async function updateProject(input: unknown) {
  const start = performance.now();
  const raw = projectUpdateSchema.parse(input);
  const { id, deadline, startDate, ...data } = raw;

  const d = parseDate(deadline ?? null);
  const sd = parseDate(startDate ?? null);
  const priority = computeProjectPriority(d);

  // Single round trip. `progress` is canonical to `status` and `status` is not
  // mutated here, so the prior pre-fetch + rewrite was redundant.
  try {
    await prisma.project.update({
      where: { id, deletedAt: null },
      data: {
        clientId: data.clientId,
        name: data.name,
        description: data.description ?? null,
        tags: data.tags,
        deadline: d,
        startDate: sd,
        priority,
      } as Prisma.ProjectUncheckedUpdateInput,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return;
    }
    throw err;
  }

  revalidateProject(id);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[perf] updateProject ${id} ${(performance.now() - start).toFixed(1)}ms`);
  }
}

export async function advanceProjectStage(id: string) {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { status: true, deadline: true, archivedAt: true },
  });
  if (!project || project.archivedAt) return;
  const current = coerceProjectStatus(String(project.status));
  const next = nextLifecycleStage(current);
  if (!next) return;
  const priority = computeProjectPriority(project.deadline);
  await prisma.project.update({
    where: { id, deletedAt: null },
    data: {
      status: toDbProjectStatus(next),
      progress: progressForStage(next),
      priority,
    },
  });
  revalidateProject(id);
}

export async function setProjectLifecycleStage(
  id: string,
  stage: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isAllowedLifecycleStage(stage)) {
    return { ok: false, error: "Invalid stage." };
  }
  const lifecycle = stage;
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: {
      status: true,
      deadline: true,
      archivedAt: true,
      clientUatData: true,
      postDeliveryData: true,
      advancePaymentAmount: true,
      requirementsGatheringData: true,
      payments: {
        where: { deletedAt: null },
        select: { amount: true, status: true },
      },
    },
  });
  if (!project || project.archivedAt) {
    return { ok: false, error: "Project unavailable." };
  }
  const current = coerceProjectStatus(String(project.status));
  if (current === lifecycle) return { ok: true };

  if (lifecycle === "CLIENT_UAT") {
    const inBuild = (BUILD_BUCKET_STAGES as readonly ProjectLifecycleStage[]).includes(current);
    if (inBuild) {
      const tasks = await prisma.task.findMany({
        where: { projectId: id, deletedAt: null },
        select: { status: true },
      });
      if (tasks.length > 0) {
        const allDone = tasks.every((t) => t.status === "DONE");
        if (!allDone) {
          return {
            ok: false,
            error:
              "Set every build task to Done before moving to Client UAT.",
          };
        }
      }
    }
  }

  if (lifecycle === "REVISIONS" && current === "CLIENT_UAT") {
    const uat = parseClientUatData(project.clientUatData);
    if (!isClientUatComplete(uat)) {
      return {
        ok: false,
        error:
          "Every UAT issue must be set to Completed (in the playbook) before moving to Revisions on the path.",
      };
    }
  }

  if (lifecycle === "PROJECT_DELIVERED" && current === "REVISIONS") {
    const uat = parseClientUatData(project.clientUatData);
    const pd = mergePostDeliveryWithIssues(
      parsePostDeliveryData(project.postDeliveryData),
      uat.issues
    );
    if (!allRevisionsApproved(uat.issues, pd.revisionApprovals)) {
      return {
        ok: false,
        error:
          "The client must approve every UAT issue in the Revisions playbook before moving to Project delivered.",
      };
    }
  }

  if (lifecycle === "PROJECT_CLOSED" && current === "PROJECT_DELIVERED") {
    const hypercare = resolveHypercareState(project.postDeliveryData);
    if (!isHypercareFullyDone(hypercare)) {
      return {
        ok: false,
        error:
          "Complete every hypercare item in the Project delivered playbook before marking the project completed.",
      };
    }
    const base = parseRequirementsGatheringData(project.requirementsGatheringData);
    const total = computeQuotationGrandTotal({
      pages: base.pages,
      checklist: base.checklist,
      pricing: mergeRequirementsPricing(base.pricing),
    });
    const snap = computeProjectBalanceSnapshot({
      quotationTotal: total,
      advanceAmount: Number(project.advancePaymentAmount ?? 0),
      payments: project.payments,
    });
    if (!isBalanceSettled(snap.balanceDue)) {
      return {
        ok: false,
        error:
          "Outstanding balance must be cleared (record paid payments on this project) before closing.",
      };
    }
  }

  const priority = computeProjectPriority(project.deadline);
  await prisma.project.update({
    where: { id, deletedAt: null },
    data: {
      status: toDbProjectStatus(lifecycle),
      progress: progressForStage(lifecycle),
      priority,
    },
  });
  revalidateProject(id);
  return { ok: true };
}

export async function saveRequirementsGatheringData(input: unknown) {
  const raw = requirementsGatheringAdvanceSchema.parse(input);
  const project = await prisma.project.findFirst({
    where: { id: raw.projectId, deletedAt: null },
    select: {
      archivedAt: true,
      status: true,
      deadline: true,
      requirementsGatheringData: true,
    },
  });
  if (!project || project.archivedAt) return;

  const lifecycle = coerceProjectStatus(String(project.status));
  const canAdvanceFromRequirements =
    lifecycle === "INITIAL_DISCUSSION" || lifecycle === "REQUIREMENTS_GATHERING";
  if (!canAdvanceFromRequirements || !raw.advanceToProposal) return;

  const pages = raw.pages.map((p) => ({
    ...p,
    title: p.title.trim() || "Untitled page",
    description: p.description.trim(),
  }));

  const prev = parseRequirementsGatheringData(project.requirementsGatheringData);
  const pricing = mergeRequirementsPricing(prev.pricing);
  const payload = {
    pages,
    checklist: raw.checklist,
    pricing,
  };

  const proposalStage: ProjectLifecycleStage = "PROPOSAL_APPROVED";
  const priority = computeProjectPriority(project.deadline);

  await prisma.project.update({
    where: { id: raw.projectId, deletedAt: null },
    data: {
      requirementsGatheringData: payload as Prisma.InputJsonValue,
      status: toDbProjectStatus(proposalStage),
      progress: progressForStage(proposalStage),
      priority,
    },
  });
  revalidateProject(raw.projectId);
}

export async function saveProposalPricingDraft(input: unknown) {
  const raw = proposalPricingSaveSchema.parse(input);
  const project = await prisma.project.findFirst({
    where: { id: raw.projectId, deletedAt: null },
    select: {
      archivedAt: true,
      status: true,
      requirementsGatheringData: true,
    },
  });
  if (!project || project.archivedAt) return;
  if (coerceProjectStatus(String(project.status)) !== "PROPOSAL_APPROVED") return;

  const prev = parseRequirementsGatheringData(project.requirementsGatheringData);
  const payload = {
    ...prev,
    pricing: mergeRequirementsPricing(raw.pricing),
  };

  await prisma.project.update({
    where: { id: raw.projectId, deletedAt: null },
    data: {
      requirementsGatheringData: payload as Prisma.InputJsonValue,
    },
  });
  revalidateProject(raw.projectId);
}

export async function advanceProposalToAdvancePayment(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      archivedAt: true,
      status: true,
      deadline: true,
    },
  });
  if (!project || project.archivedAt) return;
  if (coerceProjectStatus(String(project.status)) !== "PROPOSAL_APPROVED") return;

  const advanceStage: ProjectLifecycleStage = "ADVANCE_PAYMENT_RECEIVED";
  const priority = computeProjectPriority(project.deadline);

  await prisma.project.update({
    where: { id: projectId, deletedAt: null },
    data: {
      status: toDbProjectStatus(advanceStage),
      progress: progressForStage(advanceStage),
      priority,
    },
  });
  revalidateProject(projectId);
}

export type AdvancePaymentResult = { ok: true } | { ok: false; error: string };

type AdvancePaymentProjectSnapshot = {
  archivedAt: Date | null;
  status: $Enums.ProjectStatus;
  deadline: Date | null;
  clientId: string;
  requirementsGatheringData: Prisma.JsonValue | null;
};

export async function saveAdvancePaymentAndContinue(
  input: unknown
): Promise<AdvancePaymentResult> {
  const parsed = advancePaymentSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid advance amount." };
  }
  const { projectId, advanceAmount } = parsed.data;

  const project = (await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      archivedAt: true,
      status: true,
      deadline: true,
      clientId: true,
      requirementsGatheringData: true,
    } as unknown as Prisma.ProjectSelect,
  })) as AdvancePaymentProjectSnapshot | null;
  if (!project || project.archivedAt) {
    return { ok: false, error: "Project unavailable." };
  }
  if (coerceProjectStatus(String(project.status)) !== "ADVANCE_PAYMENT_RECEIVED") {
    return {
      ok: false,
      error: "Advance payment can only be recorded in that stage.",
    };
  }

  const base = parseRequirementsGatheringData(project.requirementsGatheringData);
  const pricing = mergeRequirementsPricing(base.pricing);
  const total = computeQuotationGrandTotal({
    pages: base.pages,
    checklist: base.checklist,
    pricing,
  });
  if (advanceAmount > total) {
    return { ok: false, error: "Advance cannot exceed the quotation total." };
  }

  const nextStage: ProjectLifecycleStage = "UI_UX_DESIGN";
  const priority = computeProjectPriority(project.deadline);

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId, deletedAt: null },
      data: {
        advancePaymentAmount: new Prisma.Decimal(advanceAmount),
        status: toDbProjectStatus(nextStage),
        progress: progressForStage(nextStage),
        priority,
      },
    });
    await seedBuildTasksFromRequirements(
      tx,
      projectId,
      project.clientId,
      project.requirementsGatheringData
    );
  });

  revalidateProject(projectId);
  return { ok: true };
}

export type UpdateTaskStatusResult = { ok: true } | { ok: false; error: string };

export async function updateProjectTaskStatus(
  input: unknown
): Promise<UpdateTaskStatusResult> {
  const parsed = projectTaskStatusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid task update." };
  }
  const raw = parsed.data;

  const task = await prisma.task.findFirst({
    where: { id: raw.taskId, deletedAt: null },
    select: {
      projectId: true,
      project: { select: { archivedAt: true, status: true } },
    },
  });
  if (!task?.projectId || !task.project || task.project.archivedAt) {
    return { ok: false, error: "Task not found." };
  }
  const projectStage = coerceProjectStatus(String(task.project.status));
  if (!BUILD_BUCKET_STAGES.includes(projectStage as (typeof BUILD_BUCKET_STAGES)[number])) {
    return { ok: false, error: "Tasks can only be updated during Build." };
  }

  await prisma.task.update({
    where: { id: raw.taskId },
    data: { status: raw.status },
  });
  revalidateProject(task.projectId);
  return { ok: true };
}

export async function saveClientUatData(input: unknown) {
  const raw = clientUatPayloadSchema.parse(input);
  const project = await prisma.project.findFirst({
    where: { id: raw.projectId, deletedAt: null },
    select: { archivedAt: true, status: true },
  });
  if (!project || project.archivedAt) return;
  if (coerceProjectStatus(String(project.status)) !== "CLIENT_UAT") return;

  const issues = sanitizeClientUatIssues(
    raw.issues.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description?.trim() ?? "",
      status: i.status,
    }))
  );
  const payload = {
    issues,
    outcomes: raw.outcomes?.trim() ?? "",
  };

  await prisma.project.update({
    where: { id: raw.projectId, deletedAt: null },
    data: { clientUatData: payload as Prisma.InputJsonValue },
  });
  revalidateProject(raw.projectId);
}

export type ClientUatAdvanceResult = { ok: true } | { ok: false; error: string };

export async function completeClientUatStage(
  input: unknown
): Promise<ClientUatAdvanceResult> {
  const parsed = clientUatPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid Client UAT data." };
  }
  const issues = sanitizeClientUatIssues(
    parsed.data.issues.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description?.trim() ?? "",
      status: i.status,
    }))
  );
  const outcomes = parsed.data.outcomes?.trim() ?? "";
  const payload = { issues, outcomes };
  if (!isClientUatComplete(payload)) {
    return {
      ok: false,
      error: "Set every UAT issue to Completed before marking UAT done.",
    };
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, deletedAt: null },
    select: { archivedAt: true, status: true, deadline: true },
  });
  if (!project || project.archivedAt) {
    return { ok: false, error: "Project unavailable." };
  }
  if (coerceProjectStatus(String(project.status)) !== "CLIENT_UAT") {
    return { ok: false, error: "This action is only available in Client UAT." };
  }

  const nextStage: ProjectLifecycleStage = "REVISIONS";
  const priority = computeProjectPriority(project.deadline);

  await prisma.project.update({
    where: { id: parsed.data.projectId, deletedAt: null },
    data: {
      clientUatData: payload as Prisma.InputJsonValue,
      status: toDbProjectStatus(nextStage),
      progress: progressForStage(nextStage),
      priority,
    },
  });
  revalidateProject(parsed.data.projectId);
  return { ok: true };
}

export async function saveRevisionApprovalsData(input: unknown) {
  const raw = revisionApprovalsSaveSchema.parse(input);
  const project = await prisma.project.findFirst({
    where: { id: raw.projectId, deletedAt: null },
    select: { archivedAt: true, status: true, clientUatData: true, postDeliveryData: true },
  });
  if (!project || project.archivedAt) return;
  if (coerceProjectStatus(String(project.status)) !== "REVISIONS") return;

  const uat = parseClientUatData(project.clientUatData);
  const merged = mergePostDeliveryWithIssues(
    parsePostDeliveryData(project.postDeliveryData),
    uat.issues
  );
  const revisionApprovals = revisionApprovalsForSave(
    raw.revisionApprovals as Record<string, unknown>,
    uat.issues
  );
  await prisma.project.update({
    where: { id: raw.projectId, deletedAt: null },
    data: {
      postDeliveryData: {
        revisionApprovals,
        hypercare: merged.hypercare,
      } as Prisma.InputJsonValue,
    },
  });
  revalidateProject(raw.projectId);
}

export type StageAdvanceResult = { ok: true } | { ok: false; error: string };

export async function advanceRevisionsToDelivered(
  projectId: string
): Promise<StageAdvanceResult> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { archivedAt: true, status: true, deadline: true, clientUatData: true, postDeliveryData: true },
  });
  if (!project || project.archivedAt) {
    return { ok: false, error: "Project unavailable." };
  }
  if (coerceProjectStatus(String(project.status)) !== "REVISIONS") {
    return { ok: false, error: "This action is only available in Revisions." };
  }
  const uat = parseClientUatData(project.clientUatData);
  const pd = mergePostDeliveryWithIssues(
    parsePostDeliveryData(project.postDeliveryData),
    uat.issues
  );
  if (!allRevisionsApproved(uat.issues, pd.revisionApprovals)) {
    return { ok: false, error: "Approve every UAT issue before moving to Project delivered." };
  }
  const nextStage: ProjectLifecycleStage = "PROJECT_DELIVERED";
  const priority = computeProjectPriority(project.deadline);
  await prisma.project.update({
    where: { id: projectId, deletedAt: null },
    data: {
      status: toDbProjectStatus(nextStage),
      progress: progressForStage(nextStage),
      priority,
      postDeliveryData: pd as Prisma.InputJsonValue,
    },
  });
  revalidateProject(projectId);
  return { ok: true };
}

export async function savePostDeliveryHypercare(input: unknown) {
  const raw = postDeliveryHypercareSaveSchema.parse(input);
  const project = await prisma.project.findFirst({
    where: { id: raw.projectId, deletedAt: null },
    select: { archivedAt: true, status: true, postDeliveryData: true, clientUatData: true },
  });
  if (!project || project.archivedAt) return;
  if (coerceProjectStatus(String(project.status)) !== "PROJECT_DELIVERED") return;

  const uat = parseClientUatData(project.clientUatData);
  const base = mergePostDeliveryWithIssues(
    parsePostDeliveryData(project.postDeliveryData),
    uat.issues
  );
  const hypercare = sanitizeHypercare(raw.hypercare);
  await prisma.project.update({
    where: { id: raw.projectId, deletedAt: null },
    data: {
      postDeliveryData: {
        revisionApprovals: base.revisionApprovals,
        hypercare,
      } as Prisma.InputJsonValue,
    },
  });
  revalidateProject(raw.projectId);
}

export async function advanceDeliveredToClosed(
  projectId: string
): Promise<StageAdvanceResult> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      archivedAt: true,
      status: true,
      deadline: true,
      postDeliveryData: true,
      advancePaymentAmount: true,
      requirementsGatheringData: true,
      payments: { where: { deletedAt: null }, select: { amount: true, status: true } },
    },
  });
  if (!project || project.archivedAt) {
    return { ok: false, error: "Project unavailable." };
  }
  if (coerceProjectStatus(String(project.status)) !== "PROJECT_DELIVERED") {
    return { ok: false, error: "This action is only available in Project delivered." };
  }
  const hypercare = resolveHypercareState(project.postDeliveryData);
  if (!isHypercareFullyDone(hypercare)) {
    return { ok: false, error: "Complete every hypercare checklist item first." };
  }
  const base = parseRequirementsGatheringData(project.requirementsGatheringData);
  const total = computeQuotationGrandTotal({
    pages: base.pages,
    checklist: base.checklist,
    pricing: mergeRequirementsPricing(base.pricing),
  });
  const snap = computeProjectBalanceSnapshot({
    quotationTotal: total,
    advanceAmount: Number(project.advancePaymentAmount ?? 0),
    payments: project.payments,
  });
  if (!isBalanceSettled(snap.balanceDue)) {
    return {
      ok: false,
      error: `Balance due is ${formatMoney(snap.balanceDue)}. Record payments (marked Paid) until the balance is zero.`,
    };
  }
  const nextStage: ProjectLifecycleStage = "PROJECT_CLOSED";
  const priority = computeProjectPriority(project.deadline);
  await prisma.project.update({
    where: { id: projectId, deletedAt: null },
    data: {
      status: toDbProjectStatus(nextStage),
      progress: progressForStage(nextStage),
      priority,
    },
  });
  revalidateProject(projectId);
  return { ok: true };
}

export type SendQuotationResult = { ok: true } | { ok: false; error: string };

export async function sendQuotationEmail(input: unknown): Promise<SendQuotationResult> {
  const parsed = sendQuotationEmailSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const errMsg =
      flat.to?.[0] ?? flat.projectId?.[0] ?? flat.pricing?.[0] ?? "Invalid input.";
    return { ok: false, error: errMsg };
  }

  const { projectId, to, pricing: pricingOverride } = parsed.data;

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      name: true,
      archivedAt: true,
      status: true,
      requirementsGatheringData: true,
      client: { select: { companyName: true } },
    },
  });

  if (!project) return { ok: false, error: "Project not found." };
  if (project.archivedAt) {
    return { ok: false, error: "Archived projects cannot send email." };
  }
  if (coerceProjectStatus(String(project.status)) !== "PROPOSAL_APPROVED") {
    return {
      ok: false,
      error: "Quotation email is only available in Proposal approved.",
    };
  }

  const base = parseRequirementsGatheringData(project.requirementsGatheringData);
  const pricing = mergeRequirementsPricing(pricingOverride ?? base.pricing);
  const scope = {
    pages: base.pages,
    checklist: base.checklist,
    pricing,
  };
  const lines = computeRequirementsQuoteLines(scope);
  const subtotal = computeRequirementsQuoteTotal(scope);
  const discountApplied = quotationDiscountApplied(subtotal, pricing);
  const total = computeQuotationGrandTotal(scope);

  const html = buildQuotationEmailHtml({
    projectName: project.name,
    clientCompany: project.client.companyName,
    lines,
    subtotal,
    discountApplied,
    total,
  });

  const subject = `Quotation — ${project.name} (${project.client.companyName})`;

  return sendTransactionalHtmlEmail({ to, subject, html });
}

export async function deleteProject(id: string) {
  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidateProject(id);
}

export async function archiveProject(id: string) {
  await prisma.project.update({
    where: { id, deletedAt: null },
    data: { archivedAt: new Date() },
  });
  revalidateProject(id);
}

export async function unarchiveProject(id: string) {
  await prisma.project.update({
    where: { id, deletedAt: null },
    data: { archivedAt: null },
  });
  revalidateProject(id);
}
