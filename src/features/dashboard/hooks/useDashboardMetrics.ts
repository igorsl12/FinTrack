import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import type { Transaction } from '@/features/transactions/types';
import {
  periodMonthSpan,
  periodShortLabel,
  periodToFilters,
  type PeriodSelection,
} from '@/features/transactions/utils/period';
import {
  getCurrentMonthKey,
  getMonthLabel,
  offsetMonthKey,
} from '@/shared/utils/date';

export type HealthStatus = 'healthy' | 'attention' | 'deficit' | 'idle';

export interface DashboardMetrics {
  /** Label of the selected window, e.g. `Set/26` or `Últimos 3 meses`. */
  periodLabel: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  /** Percent of income consumed by expenses (0..∞). */
  spendingRate: number;
  health: HealthStatus;
  /** Balance variation vs the previous month; null when not comparable. */
  balanceDelta: number | null;
  expenseByCategory: Record<string, number>;
  monthlyFlow: ReturnType<
    ReturnType<typeof useTransactions>['getMonthlyFlow']
  >;
  recentTransactions: Transaction[];
  hasData: boolean;
  hasPeriodData: boolean;
}

const DEFAULT_SELECTION: PeriodSelection = { period: 'month' };

/**
 * Aggregates the data the Dashboard needs for the selected period.
 *
 * Defaults to the current month — the window the user is actively
 * managing — but accepts any selection from the shared period filter.
 */
export function useDashboardMetrics(
  selection: PeriodSelection = DEFAULT_SELECTION,
): DashboardMetrics {
  const tx = useTransactions();

  return useMemo(() => {
    const base = periodToFilters(selection);
    const isSingleMonth = selection.period === 'month';
    const selectedMonth = selection.month || getCurrentMonthKey();

    const totalIncome = tx.getTotalIncome(base);
    const totalExpenses = tx.getTotalExpenses(base);
    const balance = totalIncome - totalExpenses;

    const spendingRate =
      totalIncome > 0
        ? (totalExpenses / totalIncome) * 100
        : totalExpenses > 0
          ? 100
          : 0;

    // NOTE: if a category is ever passed in here, `spendingRate` stops being
    // meaningful — an expense category has no income, so it pins to 100%.
    let health: HealthStatus;
    if (totalIncome === 0 && totalExpenses === 0) health = 'idle';
    else if (balance < 0) health = 'deficit';
    else if (spendingRate < 70) health = 'healthy';
    else health = 'attention';

    // Month-over-month only makes sense when looking at a single month.
    let balanceDelta: number | null = null;
    if (isSingleMonth) {
      const previousMonth = offsetMonthKey(1, monthKeyToDate(selectedMonth));
      const previousFilters = { ...base, month: previousMonth };
      const previousBalance =
        tx.getTotalIncome(previousFilters) -
        tx.getTotalExpenses(previousFilters);
      balanceDelta =
        previousBalance !== 0
          ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100
          : balance !== 0
            ? null
            : 0;
    }

    return {
      periodLabel: isSingleMonth
        ? getMonthLabel(selectedMonth)
        : periodShortLabel(selection.period),
      totalIncome,
      totalExpenses,
      balance,
      spendingRate,
      health,
      balanceDelta,
      expenseByCategory: tx.getByCategory('expense', base),
      monthlyFlow: tx.getMonthlyFlow(
        periodMonthSpan(selection.period),
        selection.category,
      ),
      recentTransactions: tx.getFilteredTransactions(base).slice(0, 5),
      hasData: tx.transactions.length > 0,
      hasPeriodData: totalIncome > 0 || totalExpenses > 0,
    };
  }, [tx, selection]);
}

function monthKeyToDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, 1);
}
