import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  startOfDay,
} from 'date-fns';
import type { Transaction } from '@/features/transactions/types';
import type { RecurringRecord } from '@/shared/db/database';

export interface ForecastEvent {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  source: 'recurring';
}

export interface ForecastDay {
  date: string;
  /** YYYY-MM-DD that the chart can use as its x-axis key. */
  label: string;
  /** Numerical day index in month for x-axis ticks. */
  dayOfMonth: number;
  balance: number;
  income: number;
  expense: number;
  events: ForecastEvent[];
  isToday: boolean;
  isPast: boolean;
}

export interface ForecastSummary {
  /** YYYY-MM key of the forecast month. */
  monthKey: string;
  today: string;
  startOfMonth: string;
  endOfMonth: string;
  /** Balance as of today. */
  currentBalance: number;
  /** Projected balance at end of month. */
  endOfMonthBalance: number;
  /** Net change from today to end of month. */
  netRemaining: number;
  /** Lowest balance reached at any point until end of month. */
  lowestBalance: number;
  /** Date when `lowestBalance` is reached. */
  lowestBalanceDate: string;
  goesNegative: boolean;
  /** First date the balance turns negative, if any. */
  firstNegativeDate: string | null;
  series: ForecastDay[];
  upcomingEvents: ForecastEvent[];
}

interface BuildForecastInput {
  transactions: Transaction[];
  recurrings: RecurringRecord[];
  today?: Date;
}

/**
 * Builds a day-by-day projection of the user's balance from the first day of
 * the current month until the last.
 *
 * Past days use real transaction data; future days project active recurring
 * plans landing on each day. Useful for spotting upcoming pinch points.
 */
export function buildForecast({
  transactions,
  recurrings,
  today: nowInput,
}: BuildForecastInput): ForecastSummary {
  const today = startOfDay(nowInput ?? new Date());
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthKey = format(today, 'yyyy-MM');

  // Balance at start of month = sum of all transactions strictly before this month
  const monthStartIso = format(monthStart, 'yyyy-MM-dd');
  let runningBalance = 0;
  for (const t of transactions) {
    if (t.date < monthStartIso) {
      runningBalance += t.type === 'income' ? t.amount : -t.amount;
    }
  }

  const byDate = bucketTransactionsByDate(transactions, monthStart, monthEnd);
  const futureEventsByDate = buildFutureEvents(recurrings, today, monthEnd);

  const series: ForecastDay[] = [];
  let currentBalance = runningBalance;
  let lowestBalance = Number.POSITIVE_INFINITY;
  let lowestBalanceDate = format(monthStart, 'yyyy-MM-dd');
  let firstNegativeDate: string | null = null;

  for (
    let cursor = monthStart;
    !isAfter(cursor, monthEnd);
    cursor = addDays(cursor, 1)
  ) {
    const iso = format(cursor, 'yyyy-MM-dd');
    const isPast = isBefore(cursor, today);
    const isToday = iso === format(today, 'yyyy-MM-dd');

    const realTx = byDate.get(iso) ?? [];
    const projectedEvents = futureEventsByDate.get(iso) ?? [];

    let dayIncome = 0;
    let dayExpense = 0;

    if (isPast || isToday) {
      for (const t of realTx) {
        if (t.type === 'income') dayIncome += t.amount;
        else dayExpense += t.amount;
      }
    } else {
      for (const e of projectedEvents) {
        if (e.type === 'income') dayIncome += e.amount;
        else dayExpense += e.amount;
      }
    }

    runningBalance += dayIncome - dayExpense;

    if (runningBalance < lowestBalance) {
      lowestBalance = runningBalance;
      lowestBalanceDate = iso;
    }
    if (runningBalance < 0 && firstNegativeDate === null) {
      firstNegativeDate = iso;
    }

    if (isToday) currentBalance = runningBalance;

    series.push({
      date: iso,
      label: iso,
      dayOfMonth: cursor.getDate(),
      balance: runningBalance,
      income: dayIncome,
      expense: dayExpense,
      events: isPast || isToday ? [] : projectedEvents,
      isToday,
      isPast,
    });
  }

  // If today has no transactions yet, ensure currentBalance reflects today's row
  if (!series.some((s) => s.isToday)) {
    currentBalance = runningBalance;
  }

  const upcomingEvents = series
    .filter((d) => !d.isPast && !d.isToday && d.events.length > 0)
    .flatMap((d) => d.events)
    .slice(0, 20);

  return {
    monthKey,
    today: format(today, 'yyyy-MM-dd'),
    startOfMonth: format(monthStart, 'yyyy-MM-dd'),
    endOfMonth: format(monthEnd, 'yyyy-MM-dd'),
    currentBalance,
    endOfMonthBalance: runningBalance,
    netRemaining: runningBalance - currentBalance,
    lowestBalance:
      lowestBalance === Number.POSITIVE_INFINITY ? currentBalance : lowestBalance,
    lowestBalanceDate,
    goesNegative: firstNegativeDate !== null,
    firstNegativeDate,
    series,
    upcomingEvents,
  };
}

function bucketTransactionsByDate(
  transactions: Transaction[],
  start: Date,
  end: Date,
): Map<string, Transaction[]> {
  const startIso = format(start, 'yyyy-MM-dd');
  const endIso = format(end, 'yyyy-MM-dd');
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.date < startIso || t.date > endIso) continue;
    const list = map.get(t.date);
    if (list) list.push(t);
    else map.set(t.date, [t]);
  }
  return map;
}

function buildFutureEvents(
  recurrings: RecurringRecord[],
  today: Date,
  monthEnd: Date,
): Map<string, ForecastEvent[]> {
  const map = new Map<string, ForecastEvent[]>();
  const tomorrow = addDays(today, 1);

  for (const plan of recurrings) {
    if (!plan.active) continue;
    const startDate = parseISO(plan.startDate);
    const endDate = plan.endDate ? parseISO(plan.endDate) : null;

    // Find candidate dates in current month
    const monthStart = startOfMonth(today);
    let cursor = monthStart;
    while (!isAfter(cursor, monthEnd)) {
      const day = Math.min(plan.dayOfMonth, endOfMonth(cursor).getDate());
      const occurrence = new Date(cursor.getFullYear(), cursor.getMonth(), day);

      const fitsWindow =
        !isBefore(occurrence, tomorrow) &&
        !isAfter(occurrence, monthEnd) &&
        !isBefore(occurrence, startDate) &&
        (!endDate || !isAfter(occurrence, endDate));

      if (fitsWindow) {
        const iso = format(occurrence, 'yyyy-MM-dd');
        const event: ForecastEvent = {
          date: iso,
          description: plan.description,
          category: plan.category,
          amount: plan.amount,
          type: plan.type,
          source: 'recurring',
        };
        const list = map.get(iso);
        if (list) list.push(event);
        else map.set(iso, [event]);
      }
      // monthEnd is in current month, so we stop after one iteration
      cursor = addMonths(cursor, 1);
    }
  }
  return map;
}
