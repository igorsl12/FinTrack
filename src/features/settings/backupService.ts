import { format } from 'date-fns';
import {
  db,
  type BudgetRecord,
  type CategoryRuleRecord,
  type PlanRecord,
  type RecurringRecord,
  type TransactionRecord,
  type UserRecord,
} from '@/shared/db/database';

export interface BackupFile {
  app: 'fintrack';
  version: 1;
  exportedAt: string;
  /** User record including hashed password — safe to import on another device. */
  user: UserRecord;
  transactions: TransactionRecord[];
  categoryRules: CategoryRuleRecord[];
  plans: PlanRecord[];
  recurrings: RecurringRecord[];
  budgets: BudgetRecord[];
}

export interface ImportResult {
  userId: string;
  userEmail: string;
  counts: {
    transactions: number;
    categoryRules: number;
    plans: number;
    recurrings: number;
    budgets: number;
  };
}

/**
 * Collects everything that belongs to one user into a portable JSON object.
 * Includes the user record itself so the backup can be imported on a new
 * device (e.g. switching from PC localhost to a phone via LAN IP, which
 * counts as a different browser origin and thus a different IndexedDB).
 */
export async function exportUserData(userId: string): Promise<BackupFile> {
  const user = await db.users.get(userId);
  if (!user) throw new Error('Usuário não encontrado para exportar.');

  const [transactions, categoryRules, plans, recurrings, budgets] =
    await Promise.all([
      db.transactions.where('userId').equals(userId).toArray(),
      db.categoryRules.where('userId').equals(userId).toArray(),
      db.plans.where('userId').equals(userId).toArray(),
      db.recurrings.where('userId').equals(userId).toArray(),
      db.budgets.where('userId').equals(userId).toArray(),
    ]);

  return {
    app: 'fintrack',
    version: 1,
    exportedAt: new Date().toISOString(),
    user,
    transactions,
    categoryRules,
    plans,
    recurrings,
    budgets,
  };
}

/** Triggers a browser download for the backup as a JSON file. */
export function downloadBackup(backup: BackupFile): string {
  const fileName = `fintrack-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return fileName;
}

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<BackupFile>;
  return v.app === 'fintrack' && v.version === 1 && !!v.user;
}

/**
 * Imports a backup file into the local database.
 *
 * Strategy: replace this user's existing data (matched by userId) with the
 * backup's records. Other users on the same device are not touched. Returns
 * a summary the UI can show.
 */
export async function importBackup(file: File): Promise<ImportResult> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Arquivo inválido: não é um JSON.');
  }
  if (!isBackupFile(parsed)) {
    throw new Error(
      'Backup inválido. Use um arquivo gerado pelo próprio FinTrack.',
    );
  }
  const backup = parsed;
  const userId = backup.user.id;

  await db.transaction(
    'rw',
    [db.users, db.transactions, db.categoryRules, db.plans, db.recurrings, db.budgets],
    async () => {
      await db.users.put(backup.user);

      await db.transactions.where('userId').equals(userId).delete();
      await db.categoryRules.where('userId').equals(userId).delete();
      await db.plans.where('userId').equals(userId).delete();
      await db.recurrings.where('userId').equals(userId).delete();
      await db.budgets.where('userId').equals(userId).delete();

      if (backup.transactions.length > 0) {
        await db.transactions.bulkAdd(backup.transactions);
      }
      if (backup.categoryRules.length > 0) {
        await db.categoryRules.bulkAdd(backup.categoryRules);
      }
      if (backup.plans.length > 0) {
        await db.plans.bulkAdd(backup.plans);
      }
      if (backup.recurrings.length > 0) {
        await db.recurrings.bulkAdd(backup.recurrings);
      }
      if (backup.budgets.length > 0) {
        await db.budgets.bulkAdd(backup.budgets);
      }
    },
  );

  return {
    userId,
    userEmail: backup.user.email,
    counts: {
      transactions: backup.transactions.length,
      categoryRules: backup.categoryRules.length,
      plans: backup.plans.length,
      recurrings: backup.recurrings.length,
      budgets: backup.budgets.length,
    },
  };
}
