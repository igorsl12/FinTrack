import {
  getCurrentMonthKey,
  getMonthLabel,
  offsetMonthKey,
} from '@/shared/utils/date';
import type { Category, TransactionFilters } from '../types';

/** Time window a screen can be scoped to. */
export type Period = 'month' | 'last3' | 'last6' | 'year' | 'all';

export interface PeriodSelection {
  period: Period;
  /** Required when period === 'month'. */
  month?: string;
  category?: Category;
}

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: 'Mês' },
  { value: 'last3', label: '3 meses' },
  { value: 'last6', label: '6 meses' },
  { value: 'year', label: '12 meses' },
  { value: 'all', label: 'Tudo' },
];

export const DEFAULT_PERIOD: Period = 'month';

/** How many months of history a period spans, for trend charts. */
export function periodMonthSpan(period: Period): number {
  switch (period) {
    case 'month':
      return 6;
    case 'last3':
      return 3;
    case 'last6':
      return 6;
    case 'year':
    case 'all':
      return 12;
  }
}

/** Compact label for headers and collapsed filter summaries. */
export function periodShortLabel(period: Period): string {
  return (
    PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? 'Mês'
  );
}

export function periodLabel(period: Period, month?: string): string {
  switch (period) {
    case 'month':
      return month ? getMonthLabel(month) : 'Mês atual';
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

/**
 * Translates a period selection into the filter shape the transaction
 * queries understand. Shared by the Dashboard and the Report so both
 * interpret "last 3 months" the exact same way.
 */
export function periodToFilters(selection: PeriodSelection): TransactionFilters {
  const base: TransactionFilters = {};
  if (selection.category) base.category = selection.category;

  switch (selection.period) {
    case 'month':
      base.month = selection.month || getCurrentMonthKey();
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
