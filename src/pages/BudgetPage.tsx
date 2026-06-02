import { useEffect, useState } from 'react';
import { Target, Trash2 } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { Button } from '@/shared/components/Button';
import { useBudgetStore } from '@/features/budget/store/budgetStore';
import { useBudgetProgress } from '@/features/budget/hooks/useBudgetProgress';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/features/transactions/types';
import { formatCurrency, formatPercent } from '@/shared/utils/currency';

export function BudgetPage() {
  const userId = useAuthStore((s) => s.currentUser?.id ?? null);
  const budgets = useBudgetStore((s) => s.budgets);
  const storeUser = useBudgetStore((s) => s.userId);
  const loadForUser = useBudgetStore((s) => s.loadForUser);
  const clear = useBudgetStore((s) => s.clear);
  const setBudget = useBudgetStore((s) => s.setBudget);
  const removeBudget = useBudgetStore((s) => s.removeBudget);

  const progress = useBudgetProgress();

  useEffect(() => {
    if (!userId) clear();
    else if (storeUser !== userId) void loadForUser(userId);
  }, [userId, storeUser, loadForUser, clear]);

  const budgetByCategory = new Map(budgets.map((b) => [b.category, b]));
  const progressByCategory = new Map(progress.map((p) => [p.category, p]));

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function getDraft(category: ExpenseCategory): string {
    if (drafts[category] !== undefined) return drafts[category];
    const existing = budgetByCategory.get(category);
    return existing ? String(existing.monthlyLimit) : '';
  }

  async function saveDraft(category: ExpenseCategory) {
    const raw = drafts[category];
    if (raw === undefined) return;
    const value = Math.max(0, Number(raw.replace(',', '.')));
    if (!Number.isFinite(value)) return;
    if (value > 0) {
      await setBudget(category, value);
    } else {
      const existing = budgetByCategory.get(category);
      if (existing) await removeBudget(existing.id);
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[category];
      return next;
    });
  }

  const totalLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = progress.reduce((sum, p) => sum + p.spent, 0);
  const totalRate = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <Layout subtitle="Limites mensais" title="Orçamento">
      <div className="space-y-4">
        <div className="card p-4 bg-balance-light text-balance-dark">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} />
            <p className="text-sm font-semibold">Orçamento por categoria</p>
          </div>
          <p className="text-xs opacity-90">
            Defina quanto pretende gastar em cada categoria por mês. Deixe em
            branco (ou zero) para desligar o limite.
          </p>
          {totalLimit > 0 && (
            <div className="mt-3 rounded-xl bg-white/50 p-3">
              <div className="flex justify-between text-xs">
                <span>Total alocado</span>
                <span className="font-semibold">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalLimit)}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-white/60 overflow-hidden">
                <div
                  className="h-full bg-balance"
                  style={{ width: `${Math.min(100, totalRate)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] opacity-80">
                {formatPercent(totalRate, 0)} consumido no mês
              </p>
            </div>
          )}
        </div>

        <ul className="space-y-2">
          {EXPENSE_CATEGORIES.map((c) => {
            const draftValue = getDraft(c);
            const prog = progressByCategory.get(c);
            const existing = budgetByCategory.get(c);
            const isDirty = drafts[c] !== undefined;
            return (
              <li key={c} className="card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{c}</p>
                  {existing && (
                    <button
                      type="button"
                      onClick={() => void removeBudget(existing.id)}
                      aria-label="Remover limite"
                      className="text-slate-400 hover:text-expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm text-slate-500">R$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={50}
                      min={0}
                      value={draftValue}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [c]: e.target.value }))
                      }
                      placeholder="0"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-balance focus:ring-2 focus:ring-balance/20"
                    />
                  </div>
                  <Button
                    size="md"
                    onClick={() => void saveDraft(c)}
                    disabled={!isDirty}
                  >
                    Salvar
                  </Button>
                </div>
                {prog && existing && (
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>
                        Gasto este mês: {formatCurrency(prog.spent)}
                      </span>
                      <span
                        className={
                          prog.status === 'over'
                            ? 'text-expense-dark'
                            : prog.status === 'warning'
                              ? 'text-warning-dark'
                              : 'text-income-dark'
                        }
                      >
                        {formatPercent(prog.rate, 0)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={[
                          'h-full rounded-full transition-all',
                          prog.status === 'over'
                            ? 'bg-expense'
                            : prog.status === 'warning'
                              ? 'bg-warning'
                              : 'bg-income',
                        ].join(' ')}
                        style={{ width: `${Math.min(100, prog.rate)}%` }}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Layout>
  );
}
