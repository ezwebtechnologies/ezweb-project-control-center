import type { RequirementsGatheringData } from "@/lib/requirements-gathering";
import type { QuoteLine } from "@/lib/requirements-pricing";

export type QuotationCustomer = {
  name: string;
  companyName: string;
  phone: string | null;
  email: string | null;
};

export type QuotationRequirementsSection = {
  title: string;
  body: string;
};

export type QuotationDocument = {
  customer: QuotationCustomer;
  lines: QuoteLine[];
  subtotal: number;
  discountApplied: number;
  total: number;
  requirementsSections: QuotationRequirementsSection[];
  quotedAt: Date;
};

const CHECKLIST_LABELS: Record<
  keyof RequirementsGatheringData["checklist"],
  string
> = {
  clientDomain: "Domain setup (basic)",
  googleBusinessProfile: "Google Business Profile",
  notifications: "Notifications",
  integrations: "Integrations",
};

export function buildRequirementsSections(
  data: RequirementsGatheringData
): QuotationRequirementsSection[] {
  const sections: QuotationRequirementsSection[] = [];

  if (data.pages.length > 0) {
    const body = data.pages
      .map((page, index) => {
        const title = page.title.trim() || `Page ${index + 1}`;
        const description = page.description.trim();
        return description
          ? `${index + 1}. ${title}\n   ${description}`
          : `${index + 1}. ${title}`;
      })
      .join("\n\n");
    sections.push({ title: "Scope of work", body });
  }

  const addons = (
    Object.entries(data.checklist) as [
      keyof RequirementsGatheringData["checklist"],
      boolean,
    ][]
  )
    .filter(([, enabled]) => enabled)
    .map(([key]) => CHECKLIST_LABELS[key]);

  if (addons.length > 0) {
    sections.push({
      title: "Additional services",
      body: addons.map((item) => `• ${item}`).join("\n"),
    });
  }

  return sections;
}

export function quotationPdfFilename(companyName: string): string {
  const base =
    companyName
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60) || "client";
  return `quotation-${base}.pdf`;
}

export function quotationEmailSubject(companyName: string): string {
  return `Quotation — ${companyName.trim() || "your business"}`;
}
