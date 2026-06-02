import { v4 as uuid } from 'uuid';
import { db, type RecurringRecord } from './database';

export const recurringRepository = {
  async listByUser(userId: string): Promise<RecurringRecord[]> {
    const rows = await db.recurrings.where('userId').equals(userId).toArray();
    return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async listActive(userId: string): Promise<RecurringRecord[]> {
    return db.recurrings
      .where('userId')
      .equals(userId)
      .filter((r) => r.active)
      .toArray();
  },

  async create(
    userId: string,
    input: Omit<RecurringRecord, 'id' | 'userId' | 'createdAt'>,
  ): Promise<RecurringRecord> {
    const record: RecurringRecord = {
      ...input,
      id: uuid(),
      userId,
      createdAt: new Date().toISOString(),
    };
    await db.recurrings.add(record);
    return record;
  },

  async update(
    userId: string,
    id: string,
    patch: Partial<Omit<RecurringRecord, 'id' | 'userId'>>,
  ): Promise<void> {
    const existing = await db.recurrings.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.recurrings.update(id, patch);
  },

  async remove(userId: string, id: string): Promise<void> {
    const existing = await db.recurrings.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.recurrings.delete(id);
  },
};
