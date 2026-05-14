import { RouteLoading } from "@/components/ui/route-loading";

export default function Loading() {
  return (
    <RouteLoading
      headline="Payments"
      subline="Loading balances, invoices, and expenses…"
    />
  );
}
