import { v4 as uuid } from 'uuid';
import { db, type UserRecord } from './database';

export const userRepository = {
  async findByEmail(email: string): Promise<UserRecord | undefined> {
    return db.users.where('email').equals(email.toLowerCase().trim()).first();
  },

  async findById(id: string): Promise<UserRecord | undefined> {
    return db.users.get(id);
  },

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
  }): Promise<UserRecord> {
    const record: UserRecord = {
      id: uuid(),
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      passwordSalt: input.passwordSalt,
      createdAt: new Date().toISOString(),
    };
    await db.users.add(record);
    return record;
  },

  async count(): Promise<number> {
    return db.users.count();
  },
};
