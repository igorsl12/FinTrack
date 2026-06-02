import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Transaction } from '../types';
import { transactionRepository } from '@/shared/db/transactionRepository';
import { migrateLegacyLocalStorage } from '../migrateLegacy';

interface TransactionState {
  transactions: Transaction[];
  userId: string | null;
  loading: boolean;
  loadForUser(userId: string): Promise<void>;
  clear(): void;
  addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<void>;
}

/**
 * Holds the in-memory list of transactions for the *currently authenticated*
 * user. Source of truth is the Dexie database via `transactionRepository`.
 *
 * Switching users is done with `loadForUser(id)`. `clear()` empties state
 * (used on logout).
 */
export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  userId: null,
  loading: false,

  async loadForUser(userId) {
    set({ loading: true, userId });
    await migrateLegacyLocalStorage(userId);
    const records = await transactionRepository.listByUser(userId);
    set({ transactions: records, loading: false });
  },

  clear() {
    set({ transactions: [], userId: null, loading: false });
  },

  async addTransaction(data) {
    const userId = get().userId;
    if (!userId) return;
    const tx: Transaction = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await transactionRepository.insert(userId, tx);
    set({ transactions: [...get().transactions, tx] });
  },

  async deleteTransaction(id) {
    const userId = get().userId;
    if (!userId) return;
    await transactionRepository.remove(userId, id);
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
  },

  async updateTransaction(id, data) {
    const userId = get().userId;
    if (!userId) return;
    await transactionRepository.update(userId, id, data);
    set({
      transactions: get().transactions.map((t) =>
        t.id === id ? { ...t, ...data } : t,
      ),
    });
  },
}));
