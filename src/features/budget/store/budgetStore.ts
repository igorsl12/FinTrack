import { create } from 'zustand';
import { budgetRepository } from '@/shared/db/budgetRepository';
import type { BudgetRecord } from '@/shared/db/database';
import type { Category } from '@/features/transactions/types';

interface BudgetState {
  budgets: BudgetRecord[];
  userId: string | null;
  loading: boolean;
  loadForUser(userId: string): Promise<void>;
  clear(): void;
  setBudget(category: Category, monthlyLimit: number): Promise<void>;
  removeBudget(id: string): Promise<void>;
}

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  budgets: [],
  userId: null,
  loading: false,

  async loadForUser(userId) {
    set({ loading: true, userId });
    const budgets = await budgetRepository.listByUser(userId);
    set({ budgets, loading: false });
  },

  clear() {
    set({ budgets: [], userId: null, loading: false });
  },

  async setBudget(category, monthlyLimit) {
    const userId = get().userId;
    if (!userId) return;
    const record = await budgetRepository.upsert(userId, category, monthlyLimit);
    const others = get().budgets.filter((b) => b.category !== category);
    set({ budgets: [...others, record] });
  },

  async removeBudget(id) {
    const userId = get().userId;
    if (!userId) return;
    await budgetRepository.remove(userId, id);
    set({ budgets: get().budgets.filter((b) => b.id !== id) });
  },
}));
