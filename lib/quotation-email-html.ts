import { format } from "date-fns";
import { formatMoney } from "@/lib/format";
import {
  formatSenderPhone,
  getQuotationLogoDataUri,
  quotationBranding,
} from "@/lib/quotation-branding";
import type { QuotationDocument } from "@/lib/quotation-document";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, "<br />");
}

export function buildQuotationEmailHtml(doc: QuotationDocument): string {
  const { customer, lines, subtotal, discountApplied, total, requirementsSections, quotedAt } =
    doc;
  const logo = getQuotationLogoDataUri();
  const phone = customer.phone?.trim() || "—";
  const email = customer.email?.trim() || "—";

  const lineRows =
    lines.length === 0
      ? `<tr><td colspan="2" style="padding:12px;color:#64748b;">No priced line items in scope.</td></tr>`
      : lines
          .map(
            (l) =>
              `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(l.label)}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;">${formatMoney(l.amount)}</td></tr>`
          )
          .join("");

  const discountRow =
    discountApplied > 0
      ? `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">Discount</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;">−${formatMoney(discountApplied)}</td></tr>`
      : "";

  const subtotalRow =
    lines.length > 0 && discountApplied > 0
      ? `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;">Subtotal</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;">${formatMoney(subtotal)}</td></tr>`
      : "";

  const requirementsHtml =
    requirementsSections.length === 0
      ? `<p style="margin:0;font-size:13px;color:#64748b;">Scope details will be confirmed before work begins.</p>`
      : requirementsSections
          .map(
            (section) => `
        <div style="margin:0 0 16px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">${escapeHtml(section.title)}</p>
          <p style="margin:0;font-size:13px;line-height:1.55;color:#334155;">${nl2br(section.body)}</p>
        </div>`
          )
          .join("");

  const logoHtml = logo
    ? `<img src="${logo}" width="56" height="56" alt="${escapeHtml(quotationBranding.companyName)}" style="display:block;border-radius:12px;" />`
    : `<div style="width:56px;height:56px;border-radius:12px;background:#1e293b;color:#f8fafc;font-weight:700;font-size:18px;line-height:56px;text-align:center;">EZ</div>`;

  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0f172a;background:#f8fafc;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px 24px 16px;">
<table role="presentation" width="100%"><tr>
<td style="vertical-align:middle;">${logoHtml}</td>
<td style="vertical-align:middle;padding-left:14px;">
<p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(quotationBranding.companyName)}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${escapeHtml(quotationBranding.companyTagline)}</p>
</td>
<td style="vertical-align:middle;text-align:right;">
<p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#6366f1;">Quotation</p>
<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${format(quotedAt, "MMM d, yyyy")}</p>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:0 24px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Prepared for</p>
<p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(customer.name)}</p>
<p style="margin:4px 0 0;font-size:14px;color:#334155;">${escapeHtml(customer.companyName)}</p>
<p style="margin:8px 0 0;font-size:13px;color:#475569;">Phone: ${escapeHtml(phone)}</p>
<p style="margin:4px 0 0;font-size:13px;color:#475569;">Email: ${escapeHtml(email)}</p>
</td></tr>
<tr><td style="padding:0 24px 20px;">
<p style="margin:0 0 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Requirements</p>
${requirementsHtml}
</td></tr>
<tr><td style="padding:0 24px 20px;">
<p style="margin:0 0 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Investment</p>
<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Item</th><th style="text-align:right;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Amount</th></tr></thead>
<tbody>${lineRows}${subtotalRow}${discountRow}</tbody>
<tfoot><tr style="background:#f8fafc;"><td style="padding:12px;font-weight:700;">Total</td><td style="padding:12px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;">${formatMoney(total)}</td></tr></tfoot>
</table>
</td></tr>
<tr><td style="padding:16px 24px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:13px;font-weight:600;color:#0f172a;">${escapeHtml(quotationBranding.senderName)}</p>
<p style="margin:4px 0 0;font-size:13px;color:#475569;">${escapeHtml(quotationBranding.companyName)}</p>
<p style="margin:4px 0 0;font-size:13px;color:#475569;">Phone: ${escapeHtml(formatSenderPhone(quotationBranding.senderPhone))}</p>
${quotationBranding.senderEmail ? `<p style="margin:4px 0 0;font-size:13px;color:#475569;">Email: ${escapeHtml(quotationBranding.senderEmail)}</p>` : ""}
<p style="margin:14px 0 0;font-size:12px;color:#64748b;">A PDF copy of this quotation is attached. Thank you for your business.</p>
</td></tr>
</table>
</body></html>`;
}
