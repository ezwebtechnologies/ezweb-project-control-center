import type { ProjectLifecycleStage } from "@/lib/project-lifecycle";
import { PROJECT_STAGE_ORDER } from "@/lib/project-lifecycle";
import { projectStatusLabels } from "@/lib/labels";

export const BUILD_BUCKET_STAGES = [
  "UI_UX_DESIGN",
  "IN_DEVELOPMENT",
  "INTERNAL_TESTING",
] as const satisfies readonly ProjectLifecycleStage[];

export type ProjectPathItem =
  | { type: "single"; stage: ProjectLifecycleStage }
  | { type: "build"; stages: readonly ProjectLifecycleStage[] };

export const PROJECT_PATH_ITEMS: ProjectPathItem[] = [
  { type: "single", stage: "REQUIREMENTS_GATHERING" },
  { type: "single", stage: "PROPOSAL_APPROVED" },
  { type: "single", stage: "ADVANCE_PAYMENT_RECEIVED" },
  { type: "build", stages: BUILD_BUCKET_STAGES },
  { type: "single", stage: "CLIENT_UAT" },
  { type: "single", stage: "REVISIONS" },
  { type: "single", stage: "PROJECT_DELIVERED" },
  { type: "single", stage: "PROJECT_CLOSED" },
];

export function pathItemKey(item: ProjectPathItem): string {
  if (item.type === "build") return "build";
  return item.stage;
}

export function pathLabelForItem(item: ProjectPathItem): string {
  if (item.type === "build") return "Build";
  if (item.stage === "PROJECT_CLOSED") return "Completed";
  return projectStatusLabels[item.stage];
}

export function getProjectPathCurrentIndex(status: ProjectLifecycleStage): number {
  if (status === "INITIAL_DISCUSSION") return 0;
  const i = PROJECT_PATH_ITEMS.findIndex((item) => {
    if (item.type === "single") return item.stage === status;
    return (item.stages as readonly string[]).includes(status);
  });
  return i >= 0 ? i : 0;
}

/** DB `ProjectStatus` written when the user selects a path column (Build → mid implementation). */
export const PATH_COLUMN_TARGET_STAGES: ProjectLifecycleStage[] = [
  "REQUIREMENTS_GATHERING",
  "PROPOSAL_APPROVED",
  "ADVANCE_PAYMENT_RECEIVED",
  "IN_DEVELOPMENT",
  "CLIENT_UAT",
  "REVISIONS",
  "PROJECT_DELIVERED",
  "PROJECT_CLOSED",
];

export function pathIndexToTargetStage(pathIndex: number): ProjectLifecycleStage | null {
  const s = PATH_COLUMN_TARGET_STAGES[pathIndex];
  return s ?? null;
}

export function isAllowedLifecycleStage(s: string): s is ProjectLifecycleStage {
  return (PROJECT_STAGE_ORDER as readonly string[]).includes(s);
}
