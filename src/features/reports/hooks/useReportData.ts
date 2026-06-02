import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { getCurrentMonthKey, offsetMonthKey } from '@/shared/utils/date';
import type {
  Category,
  TransactionFilters,
} from '@/features/transactions/types';

export type HealthStatus = 'healthy' | 'attention' | 'deficit';

export type ReportPeriod = 'month' | 'last3' | 'last6' | 'year' | 'all';

export interface ReportFilters {
  period: ReportPeriod;
  /** Required when period === 'month'. */
  month?: string;
  category?: Category;
}

export interface ReportInsights {
  topCategory?: { name: string; value: number; pct: number };
  savingsRate: number;
  monthOverMonthDelta: number;
  expenseChange: number;
  message: string;
}

function periodLabel(p: ReportPeriod, month?: string): string {
  switch (p) {
    case 'month':
      return month ? `Mês: ${month}` : 'Mês atual';
    case 'last3':
      return 'Últimos 3 meses';
    case 'last6':
      return 'Últimos 6 meses';
    case 'year':
      return 'Últimos 12 meses';
    case 'all':
      return 'Histórico completo';
  }
}

function periodFilters(filters: ReportFilters): TransactionFilters {
  const base: TransactionFilters = {};
  if (filters.category) base.category = filters.category;

  switch (filters.period) {
    case 'month':
      if (filters.month) base.month = filters.month;
      else base.month = getCurrentMonthKey();
      break;
    case 'last3':
      base.dateFrom = `${offsetMonthKey(2)}-01`;
      break;
    case 'last6':
      base.dateFrom = `${offsetMonthKey(5)}-01`;
      break;
    case 'year':
      base.dateFrom = `${offsetMonthKey(11)}-01`;
      break;
    case 'all':
      break;
  }
  return base;
}

/**
 * Aggregates the data the Report page needs given a filter selection.
 *
 * Supports any period (a single month, last N months, year, all-time)
 * and an optional category filter (drills into spending of one category).
 */
export function useReportData(filters: ReportFilters) {
  const tx = useTransactions();

  return useMemo(() => {
    const base = periodFilters(filters);

    const income = tx.getTotalIncome(base);
    const expenses = tx.getTotalExpenses(base);
    const balance = income - expenses;
    const spendRate =
      income > 0 ? (expenses / income) * 100 : expenses > 0 ? 100 : 0;

    let health: HealthStatus = 'deficit';
    if (balance >= 0 && spendRate < 70) health = 'healthy';
    else if (balance >= 0) health = 'attention';

    const expenseByCategory = tx.getByCategory('expense', base);
    const totalExpenses = Object.values(expenseByCategory).reduce(
      (s, v) => s + v,
      0,
    );
    const ranking = Object.entries(expenseByCategory)
      .map(([name, value]) => ({
        name,
        value,
        pct: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // Period-over-period comparison: only meaningful for single month
    const isSingleMonth = filters.period === 'month';
    const previousMonth = isSingleMonth
      ? offsetMonthKey(1, parseToDate(filters.month ?? getCurrentMonthKey()))
      : null;
    const prevIncome = previousMonth
      ? tx.getTotalIncome({ ...base, month: previousMonth })
      : 0;
    const prevExpenses = previousMonth
      ? tx.getTotalExpenses({ ...base, month: previousMonth })
      : 0;
    const prevBalance = prevIncome - prevExpenses;

    const monthOverMonthDelta = isSingleMonth
      ? prevBalance !== 0
        ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100
        : balance > 0
          ? 100
          : 0
      : 0;
    const expenseChange = isSingleMonth
      ? prevExpenses > 0
        ? ((expenses - prevExpenses) / prevExpenses) * 100
        : expenses > 0
          ? 100
          : 0
      : 0;

    const top = ranking[0];
    const insights: ReportInsights = {
      topCategory: top
        ? { name: top.name, value: top.value, pct: top.pct }
        : undefined,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      monthOverMonthDelta,
      expenseChange,
      message: buildMessage({
        health,
        topCategory: top?.name,
        topPct: top?.pct ?? 0,
        spendRate,
        expenseChange,
        isSingleMonth,
      }),
    };

    return {
      label: periodLabel(filters.period, filters.month),
      income,
      expenses,
      balance,
      spendRate,
      health,
      ranking,
      isSingleMonth,
      currentMonth: filters.month ?? getCurrentMonthKey(),
      previousMonth: previousMonth ?? '',
      previous: {
        income: prevIncome,
        expenses: prevExpenses,
        balance: prevBalance,
      },
      insights,
    };
  }, [tx, filters]);
}

function parseToDate(monthKey: string): Date {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, 1);
}

interface MessageInput {
  health: HealthStatus;
  topCategory?: string;
  topPct: number;
  spendRate: number;
  expenseChange: number;
  isSingleMonth: boolean;
}

function buildMessage(input: MessageInput): string {
  const parts: string[] = [];
  if (input.health === 'healthy') {
    parts.push(
      `Período saudável: gastos em ${input.spendRate.toFixed(0)}% das receitas, com folga no orçamento.`,
    );
  } else if (input.health === 'attention') {
    parts.push(
      `Atenção: ${input.spendRate.toFixed(0)}% das receitas comprometidas. Margem estreita.`,
    );
  } else {
    parts.push(
      'Período em déficit: despesas superaram as receitas. Vale revisar gastos não essenciais.',
    );
  }
  if (input.topCategory && input.topPct > 0) {
    parts.push(
      `Categoria líder: "${input.topCategory}" com ${input.topPct.toFixed(0)}% das despesas.`,
    );
  }
  if (input.isSingleMonth && Math.abs(input.expenseChange) > 5) {
    const dir = input.expenseChange > 0 ? 'aumentaram' : 'diminuíram';
    parts.push(
      `Despesas ${dir} ${Math.abs(input.expenseChange).toFixed(0)}% vs mês anterior.`,
    );
  }
  return parts.join(' ');
}
