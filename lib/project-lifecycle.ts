import type { ProjectPriority } from "@prisma/client";

export const PROJECT_STAGE_ORDER = [
  "INITIAL_DISCUSSION",
  "REQUIREMENTS_GATHERING",
  "PROPOSAL_APPROVED",
  "ADVANCE_PAYMENT_RECEIVED",
  "UI_UX_DESIGN",
  "IN_DEVELOPMENT",
  "INTERNAL_TESTING",
  "CLIENT_UAT",
  "REVISIONS",
  "PROJECT_DELIVERED",
  "PROJECT_CLOSED",
] as const;

export type ProjectLifecycleStage = (typeof PROJECT_STAGE_ORDER)[number];

export const INITIAL_LIFECYCLE_STAGE: ProjectLifecycleStage =
  PROJECT_STAGE_ORDER[0];

const STAGE_PROGRESS: Record<ProjectLifecycleStage, number> = {
  INITIAL_DISCUSSION: 8,
  REQUIREMENTS_GATHERING: 15,
  PROPOSAL_APPROVED: 25,
  ADVANCE_PAYMENT_RECEIVED: 35,
  UI_UX_DESIGN: 48,
  IN_DEVELOPMENT: 60,
  INTERNAL_TESTING: 72,
  CLIENT_UAT: 80,
  REVISIONS: 88,
  PROJECT_DELIVERED: 98,
  PROJECT_CLOSED: 100,
};

export const projectStageShortLabels: Record<ProjectLifecycleStage, string> = {
  INITIAL_DISCUSSION: "Discussion",
  REQUIREMENTS_GATHERING: "Requirements",
  PROPOSAL_APPROVED: "Proposal",
  ADVANCE_PAYMENT_RECEIVED: "Payment",
  UI_UX_DESIGN: "UI/UX",
  IN_DEVELOPMENT: "Development",
  INTERNAL_TESTING: "Internal QA",
  CLIENT_UAT: "Client UAT",
  REVISIONS: "Revisions",
  PROJECT_DELIVERED: "Delivered",
  PROJECT_CLOSED: "Closed",
};

export function progressForStage(status: ProjectLifecycleStage): number {
  return STAGE_PROGRESS[status] ?? 0;
}

export function stageIndex(status: ProjectLifecycleStage): number {
  return PROJECT_STAGE_ORDER.indexOf(status);
}

export function nextLifecycleStage(
  status: ProjectLifecycleStage
): ProjectLifecycleStage | null {
  const i = stageIndex(status);
  if (i < 0 || i >= PROJECT_STAGE_ORDER.length - 1) return null;
  return PROJECT_STAGE_ORDER[i + 1]!;
}

export function computeProjectPriority(
  deadline: Date | null | undefined,
  now = new Date()
): ProjectPriority {
  if (!deadline) return "MEDIUM";
  const end = deadline.getTime();
  const t = now.getTime();
  if (end < t) return "OVERDUE";
  const days = (end - t) / (1000 * 60 * 60 * 24);
  if (days <= 2) return "CRITICAL";
  if (days <= 7) return "HIGH";
  if (days <= 14) return "MEDIUM";
  return "LOW";
}

const LEGACY_DB_STATUS: Record<string, ProjectLifecycleStage> = {
  LEAD: "INITIAL_DISCUSSION",
  DISCUSSIONS: "REQUIREMENTS_GATHERING",
  QUOTE_FINALIZED: "PROPOSAL_APPROVED",
  DEVELOPMENT: "IN_DEVELOPMENT",
  CLIENT_TESTING: "CLIENT_UAT",
  DELIVERED: "PROJECT_DELIVERED",
};

export function coerceProjectStatus(raw: string): ProjectLifecycleStage {
  if (raw in LEGACY_DB_STATUS) return LEGACY_DB_STATUS[raw]!;
  const order = PROJECT_STAGE_ORDER as readonly string[];
  if (order.includes(raw)) return raw as ProjectLifecycleStage;
  return "INITIAL_DISCUSSION";
}
