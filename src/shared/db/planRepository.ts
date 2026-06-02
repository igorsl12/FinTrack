import { v4 as uuid } from 'uuid';
import { db, type PlanRecord } from './database';

export const planRepository = {
  async listByUser(userId: string): Promise<PlanRecord[]> {
    const rows = await db.plans.where('userId').equals(userId).toArray();
    return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async create(
    userId: string,
    input: Omit<PlanRecord, 'id' | 'userId' | 'createdAt'>,
  ): Promise<PlanRecord> {
    const record: PlanRecord = {
      ...input,
      id: uuid(),
      userId,
      createdAt: new Date().toISOString(),
    };
    await db.plans.add(record);
    return record;
  },

  async update(
    userId: string,
    id: string,
    patch: Partial<Omit<PlanRecord, 'id' | 'userId'>>,
  ): Promise<void> {
    const existing = await db.plans.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.plans.update(id, patch);
  },

  async remove(userId: string, id: string): Promise<void> {
    const existing = await db.plans.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.plans.delete(id);
  },
};
