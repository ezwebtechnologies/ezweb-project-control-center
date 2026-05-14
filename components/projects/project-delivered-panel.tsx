"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  advanceDeliveredToClosed,
  savePostDeliveryHypercare,
} from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  HYPERCARE_ITEMS,
  mergePostDeliveryWithIssues,
  parsePostDeliveryData,
  resolveHypercareState,
  isHypercareFullyDone,
} from "@/lib/post-delivery";
import { parseClientUatData } from "@/lib/client-uat";
import { isBalanceSettled } from "@/lib/project-balance";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@prisma/client";

type PaymentRow = { id: string; amount: number; status: PaymentStatus; currency: string };

type BalanceSnapshot = {
  contractTotal: number;
  advance: number;
  paidTowardContract: number;
  balanceDue: number;
};

type Props = {
  projectId: string;
  clientUatData: unknown;
  postDeliveryData: unknown;
  balance: BalanceSnapshot;
  payments: PaymentRow[];
  archived: boolean;
};

export function ProjectDeliveredPanel({
  projectId,
  clientUatData,
  postDeliveryData,
  balance,
  payments,
  archived,
}: Props) {
  const router = useRouter();
  const snapshot = JSON.stringify(postDeliveryData ?? null);
  const uat = parseClientUatData(clientUatData);
  const base = mergePostDeliveryWithIssues(parsePostDeliveryData(postDeliveryData), uat.issues);
  const [hypercare, setHypercare] = useState(base.hypercare);
  const [savePending, startSave] = useTransition();
  const [closePending, startClose] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setHypercare(resolveHypercareState(postDeliveryData));
  }, [snapshot, postDeliveryData]);

  const hypercareDone = isHypercareFullyDone(hypercare);
  const balanceOk = isBalanceSettled(balance.balanceDue);
  const canClose = hypercareDone && balanceOk;
  const busy = savePending || closePending;

  function toggleHypercare(id: string, checked: boolean) {
    if (archived) return;
    setHypercare((prev) => ({ ...prev, [id]: checked }));
    setFeedback(null);
  }

  function persistHypercare() {
    if (archived) return;
    setFeedback(null);
    startSave(async () => {
      try {
        await savePostDeliveryHypercare({ projectId, hypercare });
        setFeedback({ ok: true, text: "Hypercare progress saved." });
        router.refresh();
      } catch {
        setFeedback({ ok: false, text: "Could not save. Try again." });
      }
    });
  }

  function closeProject() {
    if (archived || !canClose) return;
    setFeedback(null);
    startClose(async () => {
      try {
        await savePostDeliveryHypercare({ projectId, hypercare });
      } catch {
        setFeedback({ ok: false, text: "Could not save hypercare before closing." });
        return;
      }
      const r = await advanceDeliveredToClosed(projectId);
      if (!r.ok) {
        setFeedback({ ok: false, text: r.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Balance</h3>
        <div className="rounded-xl border border-border/45 bg-muted/[0.06] p-3 text-sm dark:bg-muted/10">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
              <dt className="text-xs text-muted-foreground">Quotation total</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatMoney(balance.contractTotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
              <dt className="text-xs text-muted-foreground">Advance recorded</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatMoney(balance.advance)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
              <dt className="text-xs text-muted-foreground">Paid on project</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatMoney(balance.paidTowardContract)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:flex-col sm:justify-start">
              <dt className="text-xs text-muted-foreground">Balance due</dt>
              <dd
                className={cn(
                  "font-semibold tabular-nums",
                  balanceOk ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                )}
              >
                {formatMoney(Math.max(0, balance.balanceDue))}
              </dd>
            </div>
          </dl>
        </div>
        {payments.length > 0 ? (
          <ul className="space-y-1.5 rounded-lg border border-border/40 px-3 py-2 text-xs">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 tabular-nums">
                <span className="text-muted-foreground">{p.status}</span>
                <span className="font-medium text-foreground">{formatMoney(p.amount, p.currency)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Hypercare completion</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tick each item when done. All must be complete before closing the project.
          </p>
        </div>
        <ul className="space-y-0 divide-y divide-border/50 rounded-xl border border-border/50 bg-muted/[0.06] dark:bg-muted/10">
          {HYPERCARE_ITEMS.map(({ id, label, hint }) => (
            <li key={id} className="flex gap-3 px-3 py-3 sm:gap-4 sm:px-4">
              <div className="flex shrink-0 items-start pt-0.5">
                <input
                  id={`hc-${id}`}
                  type="checkbox"
                  checked={Boolean(hypercare[id])}
                  disabled={archived || busy}
                  onChange={(e) => toggleHypercare(id, e.target.checked)}
                  className={cn(
                    "size-4 rounded border-input bg-background shadow-sm transition-colors",
                    "accent-[hsl(var(--sidebar-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Label
                  htmlFor={`hc-${id}`}
                  className={cn(
                    "cursor-pointer text-sm font-medium leading-none text-foreground",
                    archived && "cursor-not-allowed opacity-60"
                  )}
                >
                  {label}
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {!archived ? (
        <div className="flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={persistHypercare}
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {savePending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save hypercare"
            )}
          </Button>
          <Button
            type="button"
            disabled={busy || !canClose}
            onClick={closeProject}
            className="flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {closePending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Closing…
              </>
            ) : (
              "Mark project completed"
            )}
          </Button>
        </div>
      ) : null}

      {!hypercareDone && !archived ? (
        <p className="text-xs text-muted-foreground">
          Complete every hypercare item to enable{" "}
          <span className="font-medium text-foreground">Mark project completed</span>.
        </p>
      ) : null}
      {hypercareDone && !balanceOk && !archived ? (
        <p className="text-xs text-muted-foreground">
          Balance must reach zero (via paid project payments) before you can close the project.
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
