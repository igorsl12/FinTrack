import { useMemo } from 'react';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { useRecurringStore } from '@/features/recurring/store/recurringStore';
import { buildForecast, type ForecastSummary } from '../utils/forecast';

/**
 * Builds the month forecast from the user's current transactions and
 * recurring plans. Reactive to changes in either store.
 */
export function useForecast(): ForecastSummary {
  const transactions = useTransactionStore((s) => s.transactions);
  const recurrings = useRecurringStore((s) => s.recurrings);

  return useMemo(
    () => buildForecast({ transactions, recurrings }),
    [transactions, recurrings],
  );
}
