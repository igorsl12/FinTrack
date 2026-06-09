import { useEffect } from 'react';
import { AppRoutes } from './routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { useRecurringStore } from '@/features/recurring/store/recurringStore';
import { useBudgetStore } from '@/features/budget/store/budgetStore';
import { useCustomCategoryStore } from '@/features/categories/store/customCategoryStore';
import { materializeRecurrings } from '@/features/recurring/materialize';
import { UpdateBanner } from '@/shared/components/UpdateBanner';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const currentUserId = useAuthStore((s) => s.currentUser?.id ?? null);

  const loadTxForUser = useTransactionStore((s) => s.loadForUser);
  const clearTx = useTransactionStore((s) => s.clear);
  const txUserId = useTransactionStore((s) => s.userId);

  const loadRecurringForUser = useRecurringStore((s) => s.loadForUser);
  const clearRecurring = useRecurringStore((s) => s.clear);

  const loadBudgetForUser = useBudgetStore((s) => s.loadForUser);
  const clearBudget = useBudgetStore((s) => s.clear);

  const loadCategoriesForUser = useCustomCategoryStore((s) => s.loadForUser);
  const clearCategories = useCustomCategoryStore((s) => s.clear);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;
    if (!currentUserId) {
      if (txUserId) {
        clearTx();
        clearRecurring();
        clearBudget();
        clearCategories();
      }
      return;
    }
    if (txUserId === currentUserId) return;
    void (async () => {
      await materializeRecurrings(currentUserId);
      await loadTxForUser(currentUserId);
      await Promise.all([
        loadRecurringForUser(currentUserId),
        loadBudgetForUser(currentUserId),
        loadCategoriesForUser(currentUserId),
      ]);
    })();
  }, [
    initialized,
    currentUserId,
    txUserId,
    loadTxForUser,
    loadRecurringForUser,
    loadBudgetForUser,
    loadCategoriesForUser,
    clearTx,
    clearRecurring,
    clearBudget,
    clearCategories,
  ]);

  return (
    <>
      <AppRoutes />
      <UpdateBanner />
    </>
  );
}
