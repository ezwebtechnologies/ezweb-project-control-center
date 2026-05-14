export const CLIENT_UAT_ISSUE_STATUSES = ["open", "in_progress", "completed"] as const;

export type ClientUatIssueStatus = (typeof CLIENT_UAT_ISSUE_STATUSES)[number];

export type ClientUatIssue = {
  id: string;
  title: string;
  description: string;
  status: ClientUatIssueStatus;
};

export type ClientUatPayload = {
  issues: ClientUatIssue[];
  outcomes: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeStatus(v: unknown): ClientUatIssueStatus {
  if (v === "open" || v === "in_progress" || v === "completed") return v;
  return "open";
}

function randomId(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    "randomUUID" in globalThis.crypto
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `uat-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function sanitizeClientUatIssues(incoming: ClientUatIssue[] | undefined): ClientUatIssue[] {
  if (!incoming?.length) return [];
  const out: ClientUatIssue[] = [];
  for (const row of incoming.slice(0, 80)) {
    const title = typeof row.title === "string" ? row.title.trim().slice(0, 320) : "";
    if (!title) continue;
    const description =
      typeof row.description === "string" ? row.description.trim().slice(0, 2000) : "";
    const id =
      typeof row.id === "string" && /^[0-9a-f-]{36}$/i.test(row.id) ? row.id : randomId();
    out.push({
      id,
      title,
      description,
      status: normalizeStatus(row.status),
    });
  }
  return out;
}

export function parseClientUatData(raw: unknown): ClientUatPayload {
  let outcomes = "";
  let issues: ClientUatIssue[] = [];
  if (isRecord(raw)) {
    if (typeof raw.outcomes === "string") outcomes = raw.outcomes;
    if (Array.isArray(raw.issues)) {
      const parsed = raw.issues
        .filter(isRecord)
        .map((x) => ({
          id: typeof x.id === "string" ? x.id : "",
          title: typeof x.title === "string" ? x.title : "",
          description: typeof x.description === "string" ? x.description : "",
          status: normalizeStatus(x.status),
        })) as ClientUatIssue[];
      issues = sanitizeClientUatIssues(parsed);
    }
  }
  return { issues, outcomes };
}

export function isClientUatComplete(data: ClientUatPayload): boolean {
  if (data.issues.length === 0) return true;
  return data.issues.every((i) => i.status === "completed");
}
