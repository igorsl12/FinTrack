import { create } from 'zustand';
import { planRepository } from '@/shared/db/planRepository';
import type { PlanRecord } from '@/shared/db/database';

interface PlansState {
  plans: PlanRecord[];
  userId: string | null;
  loading: boolean;
  loadForUser(userId: string): Promise<void>;
  clear(): void;
  createPlan(
    input: Omit<PlanRecord, 'id' | 'userId' | 'createdAt'>,
  ): Promise<void>;
  deletePlan(id: string): Promise<void>;
}

export const usePlansStore = create<PlansState>()((set, get) => ({
  plans: [],
  userId: null,
  loading: false,

  async loadForUser(userId) {
    set({ loading: true, userId });
    const plans = await planRepository.listByUser(userId);
    set({ plans, loading: false });
  },

  clear() {
    set({ plans: [], userId: null, loading: false });
  },

  async createPlan(input) {
    const userId = get().userId;
    if (!userId) return;
    const record = await planRepository.create(userId, input);
    set({ plans: [record, ...get().plans] });
  },

  async deletePlan(id) {
    const userId = get().userId;
    if (!userId) return;
    await planRepository.remove(userId, id);
    set({ plans: get().plans.filter((p) => p.id !== id) });
  },
}));
