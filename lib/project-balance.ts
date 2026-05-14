import type { PaymentStatus } from "@prisma/client";

type PaymentRow = { amount: unknown; status: PaymentStatus };

export function computeProjectBalanceSnapshot(params: {
  quotationTotal: number;
  advanceAmount: number;
  payments: PaymentRow[];
}) {
  const contractTotal = Math.max(0, Number(params.quotationTotal) || 0);
  const advance = Math.max(0, Number(params.advanceAmount) || 0);
  const paidTowardContract = params.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceDue = Math.round((contractTotal - advance - paidTowardContract) * 100) / 100;
  return { contractTotal, advance, paidTowardContract, balanceDue };
}

export function isBalanceSettled(balanceDue: number): boolean {
  return balanceDue <= 0.01;
}
