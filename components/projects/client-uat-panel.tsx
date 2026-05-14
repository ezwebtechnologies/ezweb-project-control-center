"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeClientUatStage, saveClientUatData } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLIENT_UAT_ISSUE_STATUSES,
  parseClientUatData,
  isClientUatComplete,
  type ClientUatIssue,
  type ClientUatIssueStatus,
  type ClientUatPayload,
} from "@/lib/client-uat";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ClientUatIssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
};

export type ClientUatPanelHandle = {
  toggleAddIssue: () => void;
};

type Props = {
  projectId: string;
  clientUatData: unknown;
  archived: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export const ClientUatPanel = forwardRef<ClientUatPanelHandle, Props>(function ClientUatPanel(
  { projectId, clientUatData, archived, onBusyChange },
  ref
) {
  const router = useRouter();
  const snapshot = JSON.stringify(clientUatData ?? null);
  const [data, setData] = useState<ClientUatPayload>(() => parseClientUatData(clientUatData));
  const [savePending, startSave] = useTransition();
  const [completePending, startComplete] = useTransition();
  const [feedback, setFeedback] = useState<{
    kind: "save" | "complete";
    ok: boolean;
    text: string;
  } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    setData(parseClientUatData(clientUatData));
  }, [snapshot, clientUatData]);

  const busy = savePending || completePending;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useImperativeHandle(
    ref,
    () => ({
      toggleAddIssue: () => {
        if (archived) return;
        setShowAdd((v) => !v);
        setFeedback(null);
      },
    }),
    [archived]
  );

  const uatReady = isClientUatComplete(data);

  function addIssue() {
    if (archived) return;
    const title = draftTitle.trim();
    if (!title) return;
    const id =
      typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `uat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const next: ClientUatIssue = {
      id,
      title: title.slice(0, 320),
      description: draftDescription.trim().slice(0, 2000),
      status: "open",
    };
    setData((prev) => ({ ...prev, issues: [...prev.issues, next] }));
    setDraftTitle("");
    setDraftDescription("");
    setShowAdd(false);
    setFeedback(null);
  }

  function updateIssue(id: string, patch: Partial<Pick<ClientUatIssue, "title" | "description" | "status">>) {
    if (archived) return;
    setData((prev) => ({
      ...prev,
      issues: prev.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
    setFeedback(null);
  }

  function persistSave() {
    if (archived) return;
    setFeedback(null);
    startSave(async () => {
      try {
        await saveClientUatData({
          projectId,
          issues: data.issues,
          outcomes: data.outcomes,
        });
        setFeedback({ kind: "save", ok: true, text: "UAT issues saved." });
        router.refresh();
      } catch {
        setFeedback({
          kind: "save",
          ok: false,
          text: "Could not save. Check your data and try again.",
        });
      }
    });
  }

  function markUatCompleted() {
    if (archived || !uatReady) return;
    setFeedback(null);
    startComplete(async () => {
      const r = await completeClientUatStage({
        projectId,
        issues: data.issues,
        outcomes: data.outcomes,
      });
      if (!r.ok) {
        setFeedback({ kind: "complete", ok: false, text: r.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {showAdd && !archived ? (
        <div className="space-y-3 rounded-xl border border-border/45 bg-muted/[0.06] p-3 dark:bg-muted/10">
          <div className="space-y-1.5">
            <Label htmlFor="uat-issue-title" className="text-xs">
              Title
            </Label>
            <Input
              id="uat-issue-title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="e.g. Checkout fails when discount code applied"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uat-issue-desc" className="text-xs">
              Details (optional)
            </Label>
            <Textarea
              id="uat-issue-desc"
              rows={2}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="Steps, browser, expected vs actual…"
              className="min-h-[4.5rem] resize-y text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={!draftTitle.trim() || busy} onClick={addIssue}>
              Add issue
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setShowAdd(false);
                setDraftTitle("");
                setDraftDescription("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {data.issues.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/55 bg-muted/15 px-3 py-8 text-center text-sm text-muted-foreground">
          No issues yet. Use <span className="font-medium text-foreground">Add issue</span> when the client reports a defect or change request.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.issues.map((issue) => (
            <li
              key={issue.id}
              className="rounded-xl border border-border/40 bg-background/50 px-3 py-3 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">{issue.title}</p>
                {issue.description ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {issue.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-2 shrink-0 sm:mt-0">
                <Select
                  value={issue.status}
                  disabled={archived || busy}
                  onValueChange={(v) => {
                    if (!v || archived) return;
                    updateIssue(issue.id, { status: v as ClientUatIssueStatus });
                  }}
                >
                  <SelectTrigger className="h-8 w-full min-w-[9.5rem] sm:w-[10.5rem]" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--anchor-width)]">
                    {CLIENT_UAT_ISSUE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            onClick={persistSave}
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
            disabled={busy || !uatReady}
            onClick={markUatCompleted}
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {completePending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Completing…
              </>
            ) : (
              "Mark UAT completed"
            )}
          </Button>
        </div>
      ) : null}

      {!uatReady && data.issues.length > 0 && !archived ? (
        <p className="text-xs text-muted-foreground">
          Set every issue to <span className="font-medium text-foreground">Completed</span> to enable{" "}
          <span className="font-medium text-foreground">Mark UAT completed</span>.
        </p>
      ) : null}

      {feedback ? (
        <p
          role="status"
          className={cn(
            "text-xs",
            feedback.ok
              ? "font-medium text-emerald-600 dark:text-emerald-400"
              : "text-destructive"
          )}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
});
