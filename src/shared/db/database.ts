import Dexie, { type Table } from 'dexie';
import type {
  Category,
  Transaction,
  TransactionType,
} from '@/features/transactions/types';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface TransactionRecord extends Transaction {
  userId: string;
}

export interface CategoryRuleRecord {
  id: string;
  userId: string;
  /** Normalized substring (uppercase, no accents) matched against description. */
  pattern: string;
  category: Category;
  type: TransactionType;
  createdAt: string;
  hitCount: number;
}

export interface PlanRecord {
  id: string;
  userId: string;
  name: string;
  initialAmount: number;
  monthlyContribution: number;
  /** Monthly interest rate as a decimal (0.01 = 1% per month). */
  monthlyRate: number;
  /** Total period in months. */
  months: number;
  targetAmount: number | null;
  createdAt: string;
}

export interface RecurringRecord {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  /** Day of month (1-31). Clamped to last day for shorter months. */
  dayOfMonth: number;
  /** Inclusive YYYY-MM-DD. First occurrence is the first matching day on or after this. */
  startDate: string;
  /** Optional inclusive YYYY-MM-DD. */
  endDate: string | null;
  /** Last YYYY-MM key for which we generated a transaction. */
  lastGeneratedMonth: string | null;
  tags: string[];
  active: boolean;
  createdAt: string;
}

export interface BudgetRecord {
  id: string;
  userId: string;
  category: Category;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Local database for FinTrack.
 *
 * Uses IndexedDB via Dexie on the web. The repositories are the only
 * consumers — to swap for SQLite on React Native, swap the Dexie tables
 * for an equivalent adapter exposing the same repository surface.
 */
export class FinTrackDB extends Dexie {
  users!: Table<UserRecord, string>;
  transactions!: Table<TransactionRecord, string>;
  categoryRules!: Table<CategoryRuleRecord, string>;
  plans!: Table<PlanRecord, string>;
  recurrings!: Table<RecurringRecord, string>;
  budgets!: Table<BudgetRecord, string>;

  constructor() {
    super('fintrack');
    this.version(1).stores({
      users: 'id, &email',
      transactions: 'id, userId, date, type, category, [userId+date]',
    });
    this.version(2).stores({
      users: 'id, &email',
      transactions: 'id, userId, date, type, category, [userId+date]',
      categoryRules: 'id, userId, pattern, [userId+pattern]',
    });
    this.version(3).stores({
      users: 'id, &email',
      transactions: 'id, userId, date, type, category, [userId+date]',
      categoryRules: 'id, userId, pattern, [userId+pattern]',
      plans: 'id, userId, createdAt',
    });
    this.version(4).stores({
      users: 'id, &email',
      transactions: 'id, userId, date, type, category, [userId+date], *tags',
      categoryRules: 'id, userId, pattern, [userId+pattern]',
      plans: 'id, userId, createdAt',
      recurrings: 'id, userId, active, [userId+active]',
      budgets: 'id, userId, category, [userId+category]',
    });
  }
}

export const db = new FinTrackDB();
