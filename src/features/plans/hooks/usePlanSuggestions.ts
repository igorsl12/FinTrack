import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';

export interface PlanSuggestions {
  /** Average monthly savings (income − expense) over the last few months. */
  averageMonthlySavings: number;
  /** Months actually observed (used for the average). */
  monthsObserved: number;
}

/**
 * Looks at the user's recent transaction history to suggest sensible
 * defaults for the projection simulator. Falls back to zero when there's
 * not enough data.
 */
export function usePlanSuggestions(): PlanSuggestions {
  const tx = useTransactions();
  return useMemo(() => {
    const flow = tx.getMonthlyFlow(6);
    const meaningful = flow.filter((m) => m.income > 0 || m.expense > 0);
    if (meaningful.length === 0) {
      return { averageMonthlySavings: 0, monthsObserved: 0 };
    }
    const sum = meaningful.reduce((acc, m) => acc + (m.income - m.expense), 0);
    const avg = sum / meaningful.length;
    return {
      averageMonthlySavings: Math.max(0, Math.round(avg)),
      monthsObserved: meaningful.length,
    };
  }, [tx]);
}
