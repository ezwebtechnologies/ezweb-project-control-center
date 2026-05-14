"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  advanceRevisionsToDelivered,
  saveRevisionApprovalsData,
} from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  mergePostDeliveryWithIssues,
  parsePostDeliveryData,
  allRevisionsApproved,
  type RevisionApprovalStatus,
} from "@/lib/post-delivery";
import { parseClientUatData } from "@/lib/client-uat";
import { cn } from "@/lib/utils";

const APPROVAL_LABEL: Record<RevisionApprovalStatus, string> = {
  pending: "Pending",
  approved: "Client approved",
  rejected: "Not approved",
};

type Props = {
  projectId: string;
  clientUatData: unknown;
  postDeliveryData: unknown;
  archived: boolean;
};

export function RevisionsPlaybookPanel({
  projectId,
  clientUatData,
  postDeliveryData,
  archived,
}: Props) {
  const router = useRouter();
  const snapshot = JSON.stringify({ uat: clientUatData ?? null, pd: postDeliveryData ?? null });
  const uat = parseClientUatData(clientUatData);
  const merged = mergePostDeliveryWithIssues(parsePostDeliveryData(postDeliveryData), uat.issues);
  const [approvals, setApprovals] = useState(merged.revisionApprovals);
  const [savePending, startSave] = useTransition();
  const [advancePending, startAdvance] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const u = parseClientUatData(clientUatData);
    const m = mergePostDeliveryWithIssues(parsePostDeliveryData(postDeliveryData), u.issues);
    setApprovals(m.revisionApprovals);
  }, [snapshot, clientUatData, postDeliveryData]);

  const ready = allRevisionsApproved(uat.issues, approvals);
  const busy = savePending || advancePending;

  function setApproval(issueId: string, value: RevisionApprovalStatus) {
    if (archived) return;
    setApprovals((prev) => ({ ...prev, [issueId]: value }));
    setFeedback(null);
  }

  function persist() {
    if (archived) return;
    setFeedback(null);
    startSave(async () => {
      try {
        await saveRevisionApprovalsData({ projectId, revisionApprovals: approvals });
        setFeedback({ ok: true, text: "Revision sign-off saved." });
        router.refresh();
      } catch {
        setFeedback({ ok: false, text: "Could not save. Try again." });
      }
    });
  }

  function advance() {
    if (archived || !ready) return;
    setFeedback(null);
    startAdvance(async () => {
      try {
        await saveRevisionApprovalsData({ projectId, revisionApprovals: approvals });
      } catch {
        setFeedback({ ok: false, text: "Could not save sign-off before continuing." });
        return;
      }
      const r = await advanceRevisionsToDelivered(projectId);
      if (!r.ok) {
        setFeedback({ ok: false, text: r.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {uat.issues.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/55 bg-muted/15 px-3 py-6 text-center text-sm text-muted-foreground">
          No UAT issues were logged. You can move forward once you confirm with the client.
        </p>
      ) : (
        <ul className="space-y-3">
          {uat.issues.map((issue) => (
            <li
              key={issue.id}
              className="rounded-xl border border-border/40 bg-background/50 px-3 py-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">{issue.title}</p>
                {issue.description ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {issue.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 w-full min-w-[12rem] shrink-0 sm:mt-0 sm:w-auto">
                <Label htmlFor={`rev-appr-${issue.id}`} className="sr-only">
                  Client decision for {issue.title}
                </Label>
                <select
                  id={`rev-appr-${issue.id}`}
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  disabled={archived || busy}
                  value={approvals[issue.id] ?? "pending"}
                  onChange={(e) => {
                    const v = e.target.value as RevisionApprovalStatus;
                    setApproval(issue.id, v);
                  }}
                >
                  {(Object.keys(APPROVAL_LABEL) as RevisionApprovalStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {APPROVAL_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!archived ? (
        <div className="flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={persist}
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {savePending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            type="button"
            disabled={busy || !ready}
            onClick={advance}
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {advancePending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Continuing…
              </>
            ) : (
              "Continue to Project delivered"
            )}
          </Button>
        </div>
      ) : null}

      {!ready && uat.issues.length > 0 && !archived ? (
        <p className="text-xs text-muted-foreground">
          Set every issue to <span className="font-medium text-foreground">Client approved</span> to
          enable <span className="font-medium text-foreground">Continue to Project delivered</span>.
        </p>
      ) : null}

      {feedback ? (
        <p
          role="status"
          className={cn(
            "text-xs",
            feedback.ok ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-destructive"
          )}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
