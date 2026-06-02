import { create } from 'zustand';
import { recurringRepository } from '@/shared/db/recurringRepository';
import type { RecurringRecord } from '@/shared/db/database';

interface RecurringState {
  recurrings: RecurringRecord[];
  userId: string | null;
  loading: boolean;
  loadForUser(userId: string): Promise<void>;
  clear(): void;
  create(
    input: Omit<RecurringRecord, 'id' | 'userId' | 'createdAt'>,
  ): Promise<void>;
  toggleActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
}

export const useRecurringStore = create<RecurringState>()((set, get) => ({
  recurrings: [],
  userId: null,
  loading: false,

  async loadForUser(userId) {
    set({ loading: true, userId });
    const recurrings = await recurringRepository.listByUser(userId);
    set({ recurrings, loading: false });
  },

  clear() {
    set({ recurrings: [], userId: null, loading: false });
  },

  async create(input) {
    const userId = get().userId;
    if (!userId) return;
    const record = await recurringRepository.create(userId, input);
    set({ recurrings: [record, ...get().recurrings] });
  },

  async toggleActive(id, active) {
    const userId = get().userId;
    if (!userId) return;
    await recurringRepository.update(userId, id, { active });
    set({
      recurrings: get().recurrings.map((r) =>
        r.id === id ? { ...r, active } : r,
      ),
    });
  },

  async remove(id) {
    const userId = get().userId;
    if (!userId) return;
    await recurringRepository.remove(userId, id);
    set({ recurrings: get().recurrings.filter((r) => r.id !== id) });
  },
}));
