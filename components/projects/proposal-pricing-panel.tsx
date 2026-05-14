"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  advanceProposalToAdvancePayment,
  saveProposalPricingDraft,
  sendQuotationEmail,
} from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseRequirementsGatheringData,
  type RequirementsGatheringData,
} from "@/lib/requirements-gathering";
import {
  computeQuotationGrandTotal,
  computeRequirementsQuoteTotal,
  mergeRequirementsPricing,
  type RequirementsPricing,
} from "@/lib/requirements-pricing";
import { RequirementsScopeSummary } from "@/components/projects/requirements-scope-summary";

type Props = {
  projectId: string;
  initialData: unknown;
  archived: boolean;
  defaultRecipientEmail?: string | null;
};

function parseDigits(raw: string) {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function stablePricingJson(p: RequirementsPricing) {
  return JSON.stringify(mergeRequirementsPricing(p));
}

export function ProposalPricingPanel({
  projectId,
  initialData,
  archived,
  defaultRecipientEmail,
}: Props) {
  const [sendPending, startSendTransition] = useTransition();
  const [advancePending, startAdvance] = useTransition();
  const [toEmail, setToEmail] = useState(() => (defaultRecipientEmail ?? "").trim());
  const [sendFeedback, setSendFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [draftHint, setDraftHint] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pricing, setPricing] = useState<RequirementsPricing>(() =>
    mergeRequirementsPricing(parseRequirementsGatheringData(initialData).pricing)
  );
  const pricingRef = useRef(pricing);
  pricingRef.current = pricing;
  const lastPersistedPricingJsonRef = useRef<string | null>(null);

  const snapshot = JSON.stringify(initialData ?? null);
  useEffect(() => {
    const p = mergeRequirementsPricing(parseRequirementsGatheringData(initialData).pricing);
    const json = stablePricingJson(p);
    if (
      lastPersistedPricingJsonRef.current !== null &&
      json === lastPersistedPricingJsonRef.current
    ) {
      return;
    }
    lastPersistedPricingJsonRef.current = json;
    pricingRef.current = p;
    setPricing(p);
  }, [snapshot, initialData]);

  useEffect(() => {
    setToEmail((defaultRecipientEmail ?? "").trim());
  }, [defaultRecipientEmail]);

  const parsedBase = useMemo(
    () => parseRequirementsGatheringData(initialData),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `snapshot` serializes `initialData`
    [snapshot]
  );

  const scopeModel: RequirementsGatheringData = useMemo(
    () => ({
      ...parsedBase,
      pricing: mergeRequirementsPricing(pricing),
    }),
    [parsedBase, pricing]
  );

  const subtotal = useMemo(
    () =>
      computeRequirementsQuoteTotal({
        pages: scopeModel.pages,
        checklist: scopeModel.checklist,
        pricing: scopeModel.pricing,
      }),
    [scopeModel]
  );

  const grand = useMemo(() => computeQuotationGrandTotal(scopeModel), [scopeModel]);

  useEffect(() => {
    if (archived) return;
    const merged = mergeRequirementsPricing(pricingRef.current);
    const json = stablePricingJson(merged);
    if (json === lastPersistedPricingJsonRef.current) {
      setDraftHint("idle");
      return;
    }
    setDraftHint("idle");
    const t = window.setTimeout(() => {
      const m2 = mergeRequirementsPricing(pricingRef.current);
      const j2 = stablePricingJson(m2);
      if (j2 === lastPersistedPricingJsonRef.current) return;
      void (async () => {
        setDraftHint("saving");
        try {
          await saveProposalPricingDraft({ projectId, pricing: m2 });
          lastPersistedPricingJsonRef.current = j2;
          setDraftHint("saved");
        } catch {
          setDraftHint("error");
        }
      })();
    }, 900);
    return () => window.clearTimeout(t);
  }, [pricing, projectId, archived]);

  function setDiscountInr(next: number) {
    const capped = Math.min(Math.max(0, next), subtotal);
    setPricing((prev) => {
      const merged = { ...mergeRequirementsPricing(prev), discountInr: capped };
      pricingRef.current = merged;
      return merged;
    });
  }

  function applyDiscountFromField(raw: string) {
    if (archived) return;
    setDiscountInr(parseDigits(raw));
  }

  function applyFinalFromField(raw: string) {
    if (archived) return;
    const target = parseDigits(raw);
    const clamped = Math.min(target, subtotal);
    setDiscountInr(subtotal - clamped);
  }

  function continueToPayment() {
    if (archived) return;
    startAdvance(async () => {
      const merged = mergeRequirementsPricing(pricingRef.current);
      await saveProposalPricingDraft({
        projectId,
        pricing: merged,
      });
      lastPersistedPricingJsonRef.current = stablePricingJson(merged);
      await advanceProposalToAdvancePayment(projectId);
    });
  }

  function sendQuotation() {
    if (archived) return;
    const trimmed = toEmail.trim();
    if (!trimmed) return;
    setSendFeedback(null);
    const merged = mergeRequirementsPricing(pricingRef.current);
    startSendTransition(async () => {
      const result = await sendQuotationEmail({
        projectId,
        to: trimmed,
        pricing: merged,
      });
      if (result.ok) {
        setSendFeedback({ ok: true, text: "Quotation email sent." });
      } else {
        setSendFeedback({ ok: false, text: result.error });
      }
    });
  }

  const billingExtras =
    !archived && subtotal > 0 ? (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="prop-discount" className="text-xs text-muted-foreground">
            Discount (INR)
          </Label>
          <Input
            id="prop-discount"
            type="text"
            inputMode="numeric"
            value={String(mergeRequirementsPricing(pricing).discountInr)}
            onChange={(e) => applyDiscountFromField(e.target.value)}
            className="h-9 tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prop-final" className="text-xs text-muted-foreground">
            Final quotation (INR)
          </Label>
          <Input
            id="prop-final"
            type="text"
            inputMode="numeric"
            value={String(grand)}
            onChange={(e) => applyFinalFromField(e.target.value)}
            className="h-9 tabular-nums"
          />
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5">
      <div className="relative">
        <RequirementsScopeSummary
          mode="billing"
          data={initialData}
          model={scopeModel}
          billingExtras={billingExtras}
        />
        {!archived && draftHint !== "idle" ? (
          <p className="mt-2 text-[11px] text-muted-foreground" aria-live="polite">
            {draftHint === "saving" ? "Saving…" : null}
            {draftHint === "saved" ? "Saved." : null}
            {draftHint === "error" ? "Could not save. Check connection and try again." : null}
          </p>
        ) : null}
      </div>

      {!archived ? (
        <div className="space-y-2 border-t border-border/40 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-md">
              <Label htmlFor="quotation-recipient-email" className="text-xs">
                Email
              </Label>
              <Input
                id="quotation-recipient-email"
                type="email"
                autoComplete="email"
                placeholder="client@company.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="h-9 w-full"
              />
            </div>
            <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2 sm:items-end">
              <Button
                type="button"
                disabled={sendPending || !toEmail.trim()}
                onClick={sendQuotation}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg"
              >
                {sendPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  "Send quotation"
                )}
              </Button>
              <Button
                type="button"
                disabled={advancePending}
                onClick={continueToPayment}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg"
              >
                {advancePending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Continuing…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
          {sendFeedback ? (
            <p
              role="status"
              className={
                sendFeedback.ok
                  ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                  : "text-xs text-destructive"
              }
            >
              {sendFeedback.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
