import { useMemo } from 'react';
import { useCustomCategoryStore } from '../store/customCategoryStore';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
  type TransactionType,
} from '@/features/transactions/types';

export interface CategoryEntry {
  name: Category;
  custom: boolean;
}

/**
 * Combines the built-in categories with the user's custom ones, exposing
 * helpers for each transaction type. Custom categories appear after the
 * defaults, separated by a blank entry only conceptually — consumers can
 * group them by the `custom` flag.
 */
export function useCategories() {
  const items = useCustomCategoryStore((s) => s.items);

  return useMemo(() => {
    const customByType: Record<TransactionType, CategoryEntry[]> = {
      income: [],
      expense: [],
    };
    for (const item of items) {
      customByType[item.type].push({ name: item.name, custom: true });
    }

    const incomeEntries: CategoryEntry[] = [
      ...INCOME_CATEGORIES.map((name) => ({ name, custom: false })),
      ...customByType.income,
    ];
    const expenseEntries: CategoryEntry[] = [
      ...EXPENSE_CATEGORIES.map((name) => ({ name, custom: false })),
      ...customByType.expense,
    ];

    function listFor(type: TransactionType): Category[] {
      return type === 'income'
        ? incomeEntries.map((e) => e.name)
        : expenseEntries.map((e) => e.name);
    }

    function entriesFor(type: TransactionType): CategoryEntry[] {
      return type === 'income' ? incomeEntries : expenseEntries;
    }

    return {
      income: incomeEntries,
      expense: expenseEntries,
      all: [...incomeEntries, ...expenseEntries],
      listFor,
      entriesFor,
      customCount: items.length,
    };
  }, [items]);
}
