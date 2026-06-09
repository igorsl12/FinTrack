import { format } from 'date-fns';
import {
  db,
  type BudgetRecord,
  type CategoryRuleRecord,
  type CustomCategoryRecord,
  type PlanRecord,
  type RecurringRecord,
  type TransactionRecord,
  type UserRecord,
} from '@/shared/db/database';

export interface BackupFile {
  app: 'fintrack';
  /** v2 adds customCategories. Older v1 backups are still importable. */
  version: 1 | 2;
  exportedAt: string;
  /** User record including hashed password — safe to import on another device. */
  user: UserRecord;
  transactions: TransactionRecord[];
  categoryRules: CategoryRuleRecord[];
  plans: PlanRecord[];
  recurrings: RecurringRecord[];
  budgets: BudgetRecord[];
  customCategories?: CustomCategoryRecord[];
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
    customCategories: number;
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

  const [
    transactions,
    categoryRules,
    plans,
    recurrings,
    budgets,
    customCategories,
  ] = await Promise.all([
    db.transactions.where('userId').equals(userId).toArray(),
    db.categoryRules.where('userId').equals(userId).toArray(),
    db.plans.where('userId').equals(userId).toArray(),
    db.recurrings.where('userId').equals(userId).toArray(),
    db.budgets.where('userId').equals(userId).toArray(),
    db.customCategories.where('userId').equals(userId).toArray(),
  ]);

  return {
    app: 'fintrack',
    version: 2,
    exportedAt: new Date().toISOString(),
    user,
    transactions,
    categoryRules,
    plans,
    recurrings,
    budgets,
    customCategories,
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
  return (
    v.app === 'fintrack' &&
    (v.version === 1 || v.version === 2) &&
    !!v.user
  );
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

  const customCategories = backup.customCategories ?? [];

  await db.transaction(
    'rw',
    [
      db.users,
      db.transactions,
      db.categoryRules,
      db.plans,
      db.recurrings,
      db.budgets,
      db.customCategories,
    ],
    async () => {
      await db.users.put(backup.user);

      await db.transactions.where('userId').equals(userId).delete();
      await db.categoryRules.where('userId').equals(userId).delete();
      await db.plans.where('userId').equals(userId).delete();
      await db.recurrings.where('userId').equals(userId).delete();
      await db.budgets.where('userId').equals(userId).delete();
      await db.customCategories.where('userId').equals(userId).delete();

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
      if (customCategories.length > 0) {
        await db.customCategories.bulkAdd(customCategories);
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
      customCategories: customCategories.length,
    },
  };
}
