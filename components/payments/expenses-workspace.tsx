"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createExpense, deleteExpense } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_CURRENCY, formatMoney } from "@/lib/format";
import type { ExpenseListRow } from "@/lib/queries/expenses";
import { useDashboardSearch } from "@/components/providers/dashboard-search-provider";
import { Loader2, Trash2 } from "lucide-react";

type Props = {
  expenses: ExpenseListRow[];
};

function formatDay(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "MMM d, yyyy");
}

export function ExpensesWorkspace({ expenses }: Props) {
  const router = useRouter();
  const { query } = useDashboardSearch();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [incurredAt, setIncurredAt] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = useMemo(
    () => Math.round(expenses.reduce((s, e) => s + e.amount, 0) * 100) / 100,
    [expenses]
  );

  const visibleExpenses = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return expenses;
    return expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(s) ||
        formatMoney(e.amount, e.currency).toLowerCase().includes(s)
    );
  }, [expenses, query]);

  const pendingDelete = deleteId ? expenses.find((e) => e.id === deleteId) : null;

  function submit() {
    const raw = amount.trim();
    const n = Number(raw);
    if (!raw || Number.isNaN(n) || n <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createExpense({
          amount: n,
          currency: APP_CURRENCY,
          description: description.trim(),
          incurredAt,
        });
        setAmount("");
        setDescription("");
        setIncurredAt(format(new Date(), "yyyy-MM-dd"));
        router.refresh();
      } catch {
        setError("Could not save expense. Try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <ConfirmDestructiveDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete expense?"
        description={
          pendingDelete
            ? `Remove this ${formatMoney(pendingDelete.amount, pendingDelete.currency)} entry: “${pendingDelete.description.slice(0, 120)}${pendingDelete.description.length > 120 ? "…" : ""}”?`
            : "Remove this expense?"
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteExpense(deleteId);
          setDeleteId(null);
          router.refresh();
        }}
      />

      <Card className="border-border/50 bg-card/60 shadow-sm ring-1 ring-border/30">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-base font-semibold">Add expense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount ({APP_CURRENCY})</Label>
              <Input
                id="expense-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Incurred</Label>
              <Input
                id="expense-date"
                type="date"
                value={incurredAt}
                onChange={(e) => setIncurredAt(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-desc">Description</Label>
            <Textarea
              id="expense-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was paid for"
              className="min-h-[4.5rem] resize-y"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="button" disabled={pending} onClick={submit} className="h-9">
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save expense"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/60 shadow-sm ring-1 ring-border/30">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2 border-b border-border/40 pb-3">
          <CardTitle className="text-base font-semibold">Expenses</CardTitle>
          <p className="text-sm font-medium tabular-nums text-muted-foreground">
            Total <span className="text-foreground">{formatMoney(total)}</span>
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          {expenses.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No expenses yet.</p>
          ) : visibleExpenses.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No expenses match your search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Incurred</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((e) => (
                    <tr key={e.id} className="border-b border-border/35 last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                        {formatDay(e.incurredAt)}
                      </td>
                      <td className="max-w-[min(28rem,55vw)] px-4 py-3 text-foreground">
                        <span className="line-clamp-2">{e.description}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                        {formatMoney(e.amount, e.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={pending}
                          aria-label={`Delete expense ${e.description.slice(0, 40)}`}
                          onClick={() => setDeleteId(e.id)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
