import { v4 as uuid } from 'uuid';
import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { recurringRepository } from '@/shared/db/recurringRepository';
import { transactionRepository } from '@/shared/db/transactionRepository';
import type { Transaction } from '@/features/transactions/types';
import type { RecurringRecord } from '@/shared/db/database';

/**
 * Generates pending transactions for the user's active recurring plans.
 *
 * Idempotent: each plan tracks the last `YYYY-MM` it generated in, so
 * running this on every app boot is safe — no duplicates.
 */
export async function materializeRecurrings(userId: string): Promise<number> {
  const active = await recurringRepository.listActive(userId);
  if (active.length === 0) return 0;

  const today = new Date();
  let generated = 0;

  for (const plan of active) {
    const newTxs = pendingTransactionsFor(plan, today);
    if (newTxs.length === 0) continue;
    await transactionRepository.insertMany(userId, newTxs);
    const lastMonth = format(parseISO(newTxs[newTxs.length - 1].date), 'yyyy-MM');
    await recurringRepository.update(userId, plan.id, {
      lastGeneratedMonth: lastMonth,
    });
    generated += newTxs.length;
  }

  return generated;
}

/** Builds the list of pending transactions for a plan, from cursor to today. */
function pendingTransactionsFor(
  plan: RecurringRecord,
  today: Date,
): Transaction[] {
  const startMonth = startOfMonth(parseISO(plan.startDate));
  const endMonth = plan.endDate ? startOfMonth(parseISO(plan.endDate)) : null;
  const todayMonth = startOfMonth(today);

  let cursor: Date;
  if (plan.lastGeneratedMonth) {
    cursor = addMonths(parseISO(`${plan.lastGeneratedMonth}-01`), 1);
  } else {
    cursor = startMonth;
  }

  const result: Transaction[] = [];
  while (
    (isBefore(cursor, todayMonth) ||
      cursor.getTime() === todayMonth.getTime()) &&
    (!endMonth || !isAfter(cursor, endMonth))
  ) {
    const day = Math.min(plan.dayOfMonth, endOfMonth(cursor).getDate());
    const txDate = new Date(cursor.getFullYear(), cursor.getMonth(), day);

    // Skip occurrences that would fall before the plan's first date or after today
    if (
      txDate.getTime() >= parseISO(plan.startDate).getTime() &&
      txDate.getTime() <= today.getTime()
    ) {
      result.push({
        id: uuid(),
        description: plan.description,
        amount: plan.amount,
        category: plan.category,
        type: plan.type,
        date: format(txDate, 'yyyy-MM-dd'),
        createdAt: new Date().toISOString(),
        tags: plan.tags.length > 0 ? plan.tags : undefined,
        recurringPlanId: plan.id,
      });
    }
    cursor = addMonths(cursor, 1);
  }
  return result;
}
