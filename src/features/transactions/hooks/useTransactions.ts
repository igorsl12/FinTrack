import { useMemo } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import type {
  Category,
  MonthlyData,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '../types';
import {
  getCurrentMonthKey,
  getMonthKey,
  getMonthLabel,
  offsetMonthKey,
} from '@/shared/utils/date';

function applyFilters(
  transactions: Transaction[],
  filters?: TransactionFilters,
): Transaction[] {
  if (!filters) return transactions;
  return transactions.filter((t) => {
    if (filters.type && t.type !== filters.type) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.month && getMonthKey(t.date) !== filters.month) return false;
    if (filters.dateFrom && t.date < filters.dateFrom) return false;
    if (filters.dateTo && t.date > filters.dateTo) return false;
    if (filters.tag) {
      if (!t.tags || !t.tags.includes(filters.tag)) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      if (q && !t.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function sumByType(
  transactions: Transaction[],
  type: TransactionType,
): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Hook that exposes the transaction list together with memoized
 * derivations (totals, balance, grouping, monthly flow).
 *
 * Side-effect free: all derivations are computed from the store snapshot
 * and stay reactive to it.
 */
export function useTransactions() {
  const transactions = useTransactionStore((s) => s.transactions);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const getFilteredTransactions = useMemo(
    () => (filters: TransactionFilters) =>
      applyFilters(transactions, filters).sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
      ),
    [transactions],
  );

  const getTotalIncome = (filters?: TransactionFilters): number =>
    sumByType(applyFilters(transactions, filters), 'income');

  const getTotalExpenses = (filters?: TransactionFilters): number =>
    sumByType(applyFilters(transactions, filters), 'expense');

  const getBalance = (filters?: TransactionFilters): number =>
    getTotalIncome(filters) - getTotalExpenses(filters);

  const getByCategory = (
    type: TransactionType,
    filters?: TransactionFilters,
  ): Record<string, number> => {
    const subset = applyFilters(transactions, { ...filters, type });
    return subset.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});
  };

  const getMonthlyFlow = (months: number): MonthlyData[] => {
    const result: MonthlyData[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthKey = offsetMonthKey(i);
      const monthTx = transactions.filter(
        (t) => getMonthKey(t.date) === monthKey,
      );
      const income = sumByType(monthTx, 'income');
      const expense = sumByType(monthTx, 'expense');
      result.push({
        month: monthKey,
        label: getMonthLabel(monthKey),
        income,
        expense,
        balance: income - expense,
      });
    }
    return result;
  };

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(getMonthKey(t.date)));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [transactions]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getFilteredTransactions,
    getTotalIncome,
    getTotalExpenses,
    getBalance,
    getByCategory,
    getMonthlyFlow,
    availableMonths,
    availableTags,
    currentMonth: getCurrentMonthKey(),
  };
}

export type CategoryTotals = Record<Category, number>;
