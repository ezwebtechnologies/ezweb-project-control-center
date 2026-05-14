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
