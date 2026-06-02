import { db, type TransactionRecord } from './database';
import type { Transaction } from '@/features/transactions/types';

function toTransaction(record: TransactionRecord): Transaction {
  const { userId: _userId, ...rest } = record;
  void _userId;
  return rest;
}

export const transactionRepository = {
  async listByUser(userId: string): Promise<Transaction[]> {
    const records = await db.transactions
      .where('userId')
      .equals(userId)
      .toArray();
    return records.map(toTransaction);
  },

  async insert(userId: string, transaction: Transaction): Promise<void> {
    await db.transactions.add({ ...transaction, userId });
  },

  async insertMany(userId: string, transactions: Transaction[]): Promise<void> {
    await db.transactions.bulkAdd(
      transactions.map((t) => ({ ...t, userId })),
    );
  },

  async update(
    userId: string,
    id: string,
    patch: Partial<Transaction>,
  ): Promise<void> {
    const existing = await db.transactions.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.transactions.update(id, patch);
  },

  async remove(userId: string, id: string): Promise<void> {
    const existing = await db.transactions.get(id);
    if (!existing || existing.userId !== userId) return;
    await db.transactions.delete(id);
  },

  async clearUser(userId: string): Promise<void> {
    await db.transactions.where('userId').equals(userId).delete();
  },
};
