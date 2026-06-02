import { v4 as uuid } from 'uuid';
import { db, type BudgetRecord } from './database';
import type { Category } from '@/features/transactions/types';

export const budgetRepository = {
  async listByUser(userId: string): Promise<BudgetRecord[]> {
    return db.budgets.where('userId').equals(userId).toArray();
  },

  async upsert(
    userId: string,
    category: Category,
    monthlyLimit: number,
  ): Promise<BudgetRecord> {
    const existing = await db.budgets
      .where('[userId+category]')
      .equals([userId, category])
      .first();
    const now = new Date().toISOString();
    if (existing) {
      const updated: BudgetRecord = {
        ...existing,
        monthlyLimit,
        updatedAt: now,
      };
      await db.budgets.put(updated);
      return updated;
    }
    const record: BudgetRecord = {
      id: uuid(),
      userId,
      category,
      monthlyLimit,
      createdAt: now,
      updatedAt: now,
    };
    await db.budgets.add(record);
    return record;
  },

  async remove(userId: string, id: string): Promise<void> {
    const existing = await db.budgets.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.budgets.delete(id);
  },
};
