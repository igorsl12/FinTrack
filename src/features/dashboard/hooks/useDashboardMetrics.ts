import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import type { Transaction } from '@/features/transactions/types';
import {
  getCurrentMonthKey,
  getMonthLabel,
  offsetMonthKey,
} from '@/shared/utils/date';

export type HealthStatus = 'healthy' | 'attention' | 'deficit' | 'idle';

export interface DashboardMetrics {
  monthLabel: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  /** Percent of income consumed by expenses (0..∞). */
  spendingRate: number;
  health: HealthStatus;
  /** Balance variation vs the previous month, as a percentage. */
  balanceDelta: number | null;
  expenseByCategory: Record<string, number>;
  monthlyFlow: ReturnType<
    ReturnType<typeof useTransactions>['getMonthlyFlow']
  >;
  recentTransactions: Transaction[];
  hasData: boolean;
  hasMonthData: boolean;
}

/**
 * Aggregates the data needed by the Dashboard.
 *
 * Focused on the current month for relevance — financial dashboards are
 * most useful when scoped to the period the user is actively managing.
 * Lifetime metrics are still derivable through the transaction hook, but
 * not the default view here.
 */
export function useDashboardMetrics(): DashboardMetrics {
  const tx = useTransactions();

  return useMemo(() => {
    const currentMonth = getCurrentMonthKey();
    const previousMonth = offsetMonthKey(1);

    const totalIncome = tx.getTotalIncome({ month: currentMonth });
    const totalExpenses = tx.getTotalExpenses({ month: currentMonth });
    const balance = totalIncome - totalExpenses;

    const previousBalance =
      tx.getTotalIncome({ month: previousMonth }) -
      tx.getTotalExpenses({ month: previousMonth });

    const spendingRate =
      totalIncome > 0
        ? (totalExpenses / totalIncome) * 100
        : totalExpenses > 0
          ? 100
          : 0;

    let health: HealthStatus;
    if (totalIncome === 0 && totalExpenses === 0) health = 'idle';
    else if (balance < 0) health = 'deficit';
    else if (spendingRate < 70) health = 'healthy';
    else health = 'attention';

    const balanceDelta =
      previousBalance !== 0
        ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100
        : balance !== 0
          ? null
          : 0;

    const expenseByCategory = tx.getByCategory('expense', {
      month: currentMonth,
    });

    const recentTransactions = tx
      .getFilteredTransactions({})
      .slice(0, 5);

    return {
      monthLabel: getMonthLabel(currentMonth),
      totalIncome,
      totalExpenses,
      balance,
      spendingRate,
      health,
      balanceDelta,
      expenseByCategory,
      monthlyFlow: tx.getMonthlyFlow(6),
      recentTransactions,
      hasData: tx.transactions.length > 0,
      hasMonthData: totalIncome > 0 || totalExpenses > 0,
    };
  }, [tx]);
}
