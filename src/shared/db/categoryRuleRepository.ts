import { v4 as uuid } from 'uuid';
import { db, type CategoryRuleRecord } from './database';
import type {
  Category,
  TransactionType,
} from '@/features/transactions/types';

export const categoryRuleRepository = {
  async listByUser(userId: string): Promise<CategoryRuleRecord[]> {
    return db.categoryRules.where('userId').equals(userId).toArray();
  },

  async upsert(
    userId: string,
    input: { pattern: string; category: Category; type: TransactionType },
  ): Promise<CategoryRuleRecord> {
    const existing = await db.categoryRules
      .where('[userId+pattern]')
      .equals([userId, input.pattern])
      .first();
    if (existing) {
      const updated: CategoryRuleRecord = {
        ...existing,
        category: input.category,
        type: input.type,
        hitCount: existing.hitCount + 1,
      };
      await db.categoryRules.put(updated);
      return updated;
    }
    const record: CategoryRuleRecord = {
      id: uuid(),
      userId,
      pattern: input.pattern,
      category: input.category,
      type: input.type,
      createdAt: new Date().toISOString(),
      hitCount: 1,
    };
    await db.categoryRules.add(record);
    return record;
  },

  async incrementHit(id: string): Promise<void> {
    const existing = await db.categoryRules.get(id);
    if (!existing) return;
    await db.categoryRules.update(id, { hitCount: existing.hitCount + 1 });
  },

  async remove(userId: string, id: string): Promise<void> {
    const existing = await db.categoryRules.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.categoryRules.delete(id);
  },
};
