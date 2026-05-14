import type { ClientUatIssue } from "@/lib/client-uat";

export const REVISION_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type RevisionApprovalStatus = (typeof REVISION_APPROVAL_STATUSES)[number];

export const HYPERCARE_ITEMS = [
  {
    id: "handover_assets",
    label: "Production handover complete",
    hint: "Final build, credentials, and access transferred to the client.",
  },
  {
    id: "hypercare_window",
    label: "Hypercare window active",
    hint: "Agreed stabilization period is underway with clear contact paths.",
  },
  {
    id: "support_runbook",
    label: "Support & escalation path agreed",
    hint: "Runbooks, SLAs, and escalation contacts are confirmed in writing.",
  },
  {
    id: "knowledge_transfer",
    label: "Knowledge transfer done",
    hint: "Training, recordings, or documentation walkthroughs are finished.",
  },
] as const;

export type HypercareId = (typeof HYPERCARE_ITEMS)[number]["id"];

export type PostDeliveryData = {
  revisionApprovals: Record<string, RevisionApprovalStatus>;
  hypercare: Record<string, boolean>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeApproval(v: unknown): RevisionApprovalStatus {
  if (v === "approved" || v === "rejected" || v === "pending") return v;
  return "pending";
}

const HYPERCARE_IDS = new Set<string>(HYPERCARE_ITEMS.map((x) => x.id));

export function defaultHypercareState(): Record<string, boolean> {
  return Object.fromEntries(HYPERCARE_ITEMS.map((x) => [x.id, false])) as Record<string, boolean>;
}

export function parsePostDeliveryData(raw: unknown): PostDeliveryData {
  const revisionApprovals: Record<string, RevisionApprovalStatus> = {};
  const hypercare: Record<string, boolean> = {};
  if (!isRecord(raw)) return { revisionApprovals, hypercare };
  if (isRecord(raw.revisionApprovals)) {
    for (const [k, v] of Object.entries(raw.revisionApprovals)) {
      if (/^[0-9a-f-]{36}$/i.test(k)) revisionApprovals[k] = normalizeApproval(v);
    }
  }
  if (isRecord(raw.hypercare)) {
    for (const [k, v] of Object.entries(raw.hypercare)) {
      if (HYPERCARE_IDS.has(k)) hypercare[k] = Boolean(v);
    }
  }
  return { revisionApprovals, hypercare };
}

export function mergePostDeliveryWithIssues(
  base: PostDeliveryData,
  issues: ClientUatIssue[]
): PostDeliveryData {
  const revisionApprovals = { ...base.revisionApprovals };
  for (const i of issues) {
    if (!(i.id in revisionApprovals)) revisionApprovals[i.id] = "pending";
  }
  const hypercare = { ...defaultHypercareState(), ...base.hypercare };
  return { revisionApprovals, hypercare };
}

export function resolveHypercareState(raw: unknown): Record<string, boolean> {
  const parsed = parsePostDeliveryData(raw);
  return { ...defaultHypercareState(), ...parsed.hypercare };
}

export function allRevisionsApproved(
  issues: ClientUatIssue[],
  revisionApprovals: Record<string, RevisionApprovalStatus>
): boolean {
  if (issues.length === 0) return true;
  return issues.every((i) => revisionApprovals[i.id] === "approved");
}

export function isHypercareFullyDone(hypercare: Record<string, boolean>): boolean {
  return HYPERCARE_ITEMS.every((item) => hypercare[item.id] === true);
}

export function revisionApprovalsForSave(
  incoming: Record<string, unknown> | undefined,
  issues: ClientUatIssue[]
): Record<string, RevisionApprovalStatus> {
  const out: Record<string, RevisionApprovalStatus> = {};
  for (const i of issues) {
    out[i.id] = normalizeApproval(incoming?.[i.id]);
  }
  return out;
}

export function sanitizeHypercare(incoming: Record<string, boolean> | undefined): Record<string, boolean> {
  const base = defaultHypercareState();
  if (!incoming) return base;
  for (const id of HYPERCARE_IDS) {
    if (Object.prototype.hasOwnProperty.call(incoming, id)) {
      base[id] = Boolean(incoming[id]);
    }
  }
  return base;
}
