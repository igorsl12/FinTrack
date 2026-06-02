import { useMemo } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { getCurrentMonthKey } from '@/shared/utils/date';
import type { Category } from '@/features/transactions/types';

export interface BudgetProgressItem {
  budgetId: string;
  category: Category;
  limit: number;
  spent: number;
  /** spent / limit * 100; uncapped so the UI can render overflow. */
  rate: number;
  status: 'ok' | 'warning' | 'over';
}

export function useBudgetProgress(): BudgetProgressItem[] {
  const budgets = useBudgetStore((s) => s.budgets);
  const tx = useTransactions();

  return useMemo(() => {
    const month = getCurrentMonthKey();
    return budgets
      .map<BudgetProgressItem>((b) => {
        const spent = tx
          .getFilteredTransactions({
            month,
            type: 'expense',
            category: b.category,
          })
          .reduce((sum, t) => sum + t.amount, 0);
        const rate = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
        const status: BudgetProgressItem['status'] =
          rate >= 100 ? 'over' : rate >= 80 ? 'warning' : 'ok';
        return {
          budgetId: b.id,
          category: b.category,
          limit: b.monthlyLimit,
          spent,
          rate,
          status,
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [budgets, tx]);
}
