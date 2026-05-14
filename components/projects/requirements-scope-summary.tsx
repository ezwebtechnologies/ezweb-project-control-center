"use client";

import type { ReactNode } from "react";
import {
  parseRequirementsGatheringData,
  type RequirementsGatheringData,
} from "@/lib/requirements-gathering";
import {
  computeRequirementsQuoteLines,
  computeRequirementsQuoteTotal,
  computeQuotationGrandTotal,
  quotationDiscountApplied,
} from "@/lib/requirements-pricing";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  data: unknown;
  /** When set, used instead of parsing `data` (for live proposal edits). */
  model?: RequirementsGatheringData;
  className?: string;
  /** `billing` = proposal stage (card headline + empty copy). */
  mode?: "scope" | "billing";
  /** Shown after line items in billing mode (e.g. discount / total fields). */
  billingExtras?: ReactNode;
};

export function RequirementsScopeSummary({
  data,
  model,
  className,
  mode = "scope",
  billingExtras,
}: Props) {
  const parsed = model ?? parseRequirementsGatheringData(data);
  const lines = computeRequirementsQuoteLines(parsed);
  const subtotal = computeRequirementsQuoteTotal(parsed);
  const discount = quotationDiscountApplied(subtotal, parsed.pricing);
  const grand = computeQuotationGrandTotal(parsed);
  const billing = mode === "billing";

  const heading = billing ? "Proposal billing" : "Scope estimate";
  const emptyCopy = billing
    ? "Nothing to bill yet. Add pages and client confirmations in requirements, then move this project to Proposal approved."
    : "Add pages and tick client confirmations, then save below to refresh this estimate and stage progress.";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/45 bg-muted/[0.07] px-4 py-3 dark:bg-muted/10",
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {heading}
      </p>
      {lines.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{emptyCopy}</p>
      ) : (
        <>
          <ul className="mt-2 space-y-1.5">
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex items-center justify-between gap-3 text-xs text-foreground/90"
              >
                <span className="min-w-0 truncate">{line.label}</span>
                <span className="shrink-0 tabular-nums font-medium">{formatMoney(line.amount)}</span>
              </li>
            ))}
          </ul>
          {billing ? (
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-2 text-xs text-foreground/90">
              <div className="flex items-center justify-between gap-3 font-medium">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(subtotal)}</span>
              </div>
            </div>
          ) : null}
          {billing && billingExtras ? (
            <div className="mt-3 border-t border-border/40 pt-3">{billingExtras}</div>
          ) : null}
          {billing && !billingExtras && discount > 0 ? (
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Discount</span>
                <span className="tabular-nums">−{formatMoney(discount)}</span>
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-sm font-semibold text-foreground">
            <span>{billing ? "Proposal total" : "Estimated total"}</span>
            <span className="tabular-nums">{formatMoney(grand)}</span>
          </div>
        </>
      )}
    </div>
  );
}
