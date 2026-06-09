import { create } from 'zustand';
import { customCategoryRepository } from '@/shared/db/customCategoryRepository';
import type { CustomCategoryRecord } from '@/shared/db/database';
import type { TransactionType } from '@/features/transactions/types';

interface CustomCategoryState {
  items: CustomCategoryRecord[];
  userId: string | null;
  loading: boolean;
  loadForUser(userId: string): Promise<void>;
  clear(): void;
  add(input: {
    name: string;
    type: TransactionType;
  }): Promise<{ ok: true; record: CustomCategoryRecord } | { ok: false; error: string }>;
  remove(id: string): Promise<void>;
}

export const useCustomCategoryStore = create<CustomCategoryState>()((set, get) => ({
  items: [],
  userId: null,
  loading: false,

  async loadForUser(userId) {
    set({ loading: true, userId });
    const items = await customCategoryRepository.listByUser(userId);
    set({ items, loading: false });
  },

  clear() {
    set({ items: [], userId: null, loading: false });
  },

  async add(input) {
    const userId = get().userId;
    if (!userId) return { ok: false, error: 'Usuário não autenticado.' };

    const trimmed = input.name.trim();
    if (trimmed.length < 2) {
      return { ok: false, error: 'Nome precisa ter ao menos 2 caracteres.' };
    }
    if (trimmed.length > 30) {
      return { ok: false, error: 'Use no máximo 30 caracteres.' };
    }

    const existing = await customCategoryRepository.findByName(userId, trimmed);
    if (existing) {
      return { ok: false, error: 'Já existe uma categoria com esse nome.' };
    }

    const record = await customCategoryRepository.create(userId, {
      name: trimmed,
      type: input.type,
    });
    set({ items: [...get().items, record] });
    return { ok: true, record };
  },

  async remove(id) {
    const userId = get().userId;
    if (!userId) return;
    await customCategoryRepository.remove(userId, id);
    set({ items: get().items.filter((c) => c.id !== id) });
  },
}));
