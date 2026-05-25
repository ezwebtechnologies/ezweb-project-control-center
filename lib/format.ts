import { format, formatDistanceToNow } from "date-fns";

export const APP_CURRENCY = "INR" as const;

function localeForCurrency(currency: string) {
  if (currency === "INR") return "en-IN";
  if (currency === "USD") return "en-US";
  return "en-IN";
}

export function formatMoney(amount: number | string, currency: string = APP_CURRENCY) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(localeForCurrency(currency), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/** WinAnsi-safe amounts for PDF standard fonts (Helvetica cannot render ₹). */
export function formatMoneyPdf(amount: number | string, currency: string = APP_CURRENCY) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const value = Number.isFinite(n) ? n : 0;
  const formatted = new Intl.NumberFormat(localeForCurrency(currency), {
    maximumFractionDigits: 0,
  }).format(value);
  if (currency === "INR") return `INR ${formatted}`;
  if (currency === "USD") return `USD ${formatted}`;
  return `${currency} ${formatted}`;
}

/** Strip/replace characters that PDF standard fonts cannot encode. */
export function pdfSafeText(text: string): string {
  return text
    .replace(/\u20b9/g, "INR ")
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[^\u0020-\u007e\u00a0-\u00ff]/g, "?");
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM d, yyyy · h:mm a");
}

export function formatRelative(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Today at local midnight as `YYYY-MM-DDTHH:mm` for `<input type="datetime-local" />`. */
export function todayStartDateTimeLocalValue() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
