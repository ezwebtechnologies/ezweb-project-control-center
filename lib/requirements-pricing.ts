import { formatMoney } from "@/lib/format";
import { progressForStage } from "@/lib/project-lifecycle";

export const DEFAULT_REQUIREMENTS_PRICING = {
  perPage: 499,
  domain: 600,
  googleBusiness: 499,
  notifications: 299,
  integrations: 449,
  discountInr: 0,
} as const;

export type RequirementsPricing = {
  perPage: number;
  domain: number;
  googleBusiness: number;
  notifications: number;
  integrations: number;
  /** Flat discount in INR applied after scope line subtotal. */
  discountInr: number;
};

export function mergeRequirementsPricing(
  raw: Partial<RequirementsPricing> | undefined
): RequirementsPricing {
  return {
    perPage: clampMoney(raw?.perPage, DEFAULT_REQUIREMENTS_PRICING.perPage),
    domain: clampMoney(raw?.domain, DEFAULT_REQUIREMENTS_PRICING.domain),
    googleBusiness: clampMoney(raw?.googleBusiness, DEFAULT_REQUIREMENTS_PRICING.googleBusiness),
    notifications: clampMoney(raw?.notifications, DEFAULT_REQUIREMENTS_PRICING.notifications),
    integrations: clampMoney(raw?.integrations, DEFAULT_REQUIREMENTS_PRICING.integrations),
    discountInr: clampDiscount(raw?.discountInr),
  };
}

function clampDiscount(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return Math.min(x, 9_999_999);
}

function clampMoney(n: unknown, fallback: number): number {
  const x = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : Number(n);
  if (!Number.isFinite(x) || x < 0) return fallback;
  return Math.min(x, 9_999_999);
}

export function quotationDiscountApplied(subtotal: number, pricing: Partial<RequirementsPricing> | undefined): number {
  const d = mergeRequirementsPricing(pricing).discountInr;
  return Math.min(Math.max(0, d), Math.max(0, subtotal));
}

export function computeQuotationGrandTotal(data: ScopeForQuote): number {
  const subtotal = computeRequirementsQuoteTotal(data);
  const applied = quotationDiscountApplied(subtotal, data.pricing);
  return Math.max(0, subtotal - applied);
}

export type QuoteLine = { id: string; label: string; amount: number };

type Checklist = {
  notifications: boolean;
  integrations: boolean;
  clientDomain: boolean;
  googleBusinessProfile: boolean;
};

type Pages = { id: string; title: string; description: string }[];

export type ScopeForQuote = {
  pages: Pages;
  checklist: Checklist;
  pricing?: Partial<RequirementsPricing>;
};

export function computeRequirementsQuoteLines(data: ScopeForQuote): QuoteLine[] {
  const p = mergeRequirementsPricing(data.pricing);
  const lines: QuoteLine[] = [];
  if (data.pages.length > 0) {
    const amount = data.pages.length * p.perPage;
    lines.push({
      id: "pages",
      label: `Pages (${data.pages.length} × ${formatMoney(p.perPage)})`,
      amount,
    });
  }
  if (data.checklist.clientDomain) {
    lines.push({ id: "domain", label: "Domain (basic)", amount: p.domain });
  }
  if (data.checklist.googleBusinessProfile) {
    lines.push({ id: "gbp", label: "Google Business Profile", amount: p.googleBusiness });
  }
  if (data.checklist.notifications) {
    lines.push({ id: "notifications", label: "Notifications", amount: p.notifications });
  }
  if (data.checklist.integrations) {
    lines.push({ id: "integrations", label: "Integrations", amount: p.integrations });
  }
  return lines;
}

export function computeRequirementsQuoteTotal(data: ScopeForQuote): number {
  return computeRequirementsQuoteLines(data).reduce((s, l) => s + l.amount, 0);
}

/** Progress % while in requirements gathering (15–24), from pages + checklist completion. */
export function computeRequirementsGatheringProgress(data: {
  pages: Pages;
  checklist: Checklist;
}): number {
  const base = progressForStage("REQUIREMENTS_GATHERING");
  const checked = Object.values(data.checklist).filter(Boolean).length;
  const hasPages = data.pages.length > 0 ? 1 : 0;
  const fill = (checked / 4) * 0.62 + hasPages * 0.38;
  const next = Math.round(base + fill * 9);
  return Math.min(24, Math.max(base, next));
}
