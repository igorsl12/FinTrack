import { v4 as uuid } from 'uuid';
import { db, type CustomCategoryRecord } from './database';
import type { TransactionType } from '@/features/transactions/types';

export const customCategoryRepository = {
  async listByUser(userId: string): Promise<CustomCategoryRecord[]> {
    const rows = await db.customCategories
      .where('userId')
      .equals(userId)
      .toArray();
    return rows.sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
    );
  },

  /**
   * Looks for an existing record matching `userId` + case-insensitive name.
   * Used to prevent duplicates before inserting.
   */
  async findByName(
    userId: string,
    name: string,
  ): Promise<CustomCategoryRecord | undefined> {
    const target = name.trim().toLowerCase();
    return db.customCategories
      .where('userId')
      .equals(userId)
      .filter((c) => c.name.trim().toLowerCase() === target)
      .first();
  },

  async create(
    userId: string,
    input: { name: string; type: TransactionType },
  ): Promise<CustomCategoryRecord> {
    const record: CustomCategoryRecord = {
      id: uuid(),
      userId,
      name: input.name.trim(),
      type: input.type,
      createdAt: new Date().toISOString(),
    };
    await db.customCategories.add(record);
    return record;
  },

  async remove(userId: string, id: string): Promise<void> {
    const existing = await db.customCategories.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.customCategories.delete(id);
  },
};
