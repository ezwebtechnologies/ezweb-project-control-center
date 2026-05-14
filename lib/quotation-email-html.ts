import { formatMoney } from "@/lib/format";
import type { QuoteLine } from "@/lib/requirements-pricing";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildQuotationEmailHtml(opts: {
  projectName: string;
  clientCompany: string;
  lines: QuoteLine[];
  subtotal: number;
  discountApplied: number;
  total: number;
}): string {
  const { projectName, clientCompany, lines, subtotal, discountApplied, total } = opts;
  const lineRows =
    lines.length === 0
      ? `<tr><td colspan="2" style="padding:12px;color:#64748b;">No priced line items yet — complete scope in requirements, then return here.</td></tr>`
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
  const rows = lineRows + subtotalRow + discountRow;
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;">
<p style="font-size:14px;margin:0 0 16px;">Quotation for <strong>${escapeHtml(projectName)}</strong> — ${escapeHtml(clientCompany)}.</p>
<table style="width:100%;max-width:480px;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Item</th><th style="text-align:right;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Amount</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td style="padding:12px;font-weight:600;">Total</td><td style="padding:12px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;">${formatMoney(total)}</td></tr></tfoot>
</table>
<p style="font-size:12px;color:#64748b;margin-top:16px;">Totals follow scope, default unit rates, and any discount saved on the project.</p>
</body></html>`;
}
