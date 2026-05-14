"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { saveAdvancePaymentAndContinue } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";

type Props = {
  projectId: string;
  quotationTotal: number;
  archived: boolean;
};

export function AdvancePaymentPanel({ projectId, quotationTotal, archived }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [advanceRaw, setAdvanceRaw] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const parsedAdvance =
    advanceRaw.trim() === ""
      ? 0
      : Number.parseInt(advanceRaw.replace(/[^\d]/g, ""), 10);
  const advanceAmount = Number.isFinite(parsedAdvance)
    ? Math.max(0, Math.min(parsedAdvance, quotationTotal))
    : 0;
  const balance = Math.max(0, quotationTotal - advanceAmount);

  function submit() {
    if (archived) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await saveAdvancePaymentAndContinue({
        projectId,
        advanceAmount,
      });
      if (!result.ok) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 bg-muted/[0.06] px-4 py-3 dark:bg-muted/10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Quotation total
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {formatMoney(quotationTotal)}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="advance-amt" className="text-xs">
          Advance received (INR)
        </Label>
        <Input
          id="advance-amt"
          type="text"
          inputMode="numeric"
          value={advanceRaw}
          onChange={(e) => setAdvanceRaw(e.target.value)}
          disabled={archived}
          className="h-9 max-w-xs tabular-nums"
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">
          Balance after advance:{" "}
          <span className="font-medium tabular-nums text-foreground">{formatMoney(balance)}</span>
        </p>
      </div>
      {!archived ? (
        <Button
          type="button"
          disabled={pending}
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-lg sm:w-auto"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Next — start build"
          )}
        </Button>
      ) : null}
      {feedback ? (
        <p
          role="status"
          className={
            feedback.ok
              ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
              : "text-xs text-destructive"
          }
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
