import { readFileSync } from "node:fs";
import { join } from "node:path";

export const quotationBranding = {
  companyName: process.env.QUOTATION_COMPANY_NAME?.trim() || "EZWeb",
  companyTagline:
    process.env.QUOTATION_COMPANY_TAGLINE?.trim() ||
    "Web design, development & digital solutions",
  senderName: process.env.QUOTATION_SENDER_NAME?.trim() || "Easwanth Konduru",
  senderPhone: process.env.QUOTATION_SENDER_PHONE?.trim() || "7777912365",
  senderEmail: process.env.QUOTATION_SENDER_EMAIL?.trim() || "",
} as const;

export function formatSenderPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

let logoDataUriCache: string | null | undefined;

/** Inline SVG logo for HTML email (data URI). */
export function getQuotationLogoDataUri(): string | null {
  if (logoDataUriCache !== undefined) return logoDataUriCache;
  try {
    const svg = readFileSync(
      join(process.cwd(), "public", "company-logo.svg"),
      "utf8"
    );
    const encoded = Buffer.from(svg).toString("base64");
    logoDataUriCache = `data:image/svg+xml;base64,${encoded}`;
  } catch {
    logoDataUriCache = null;
  }
  return logoDataUriCache;
}
