import { webStorage } from '@/shared/lib/storage';
import { transactionRepository } from '@/shared/db/transactionRepository';
import type { Transaction } from './types';

const LEGACY_KEY = 'fintrack:transactions';
const FLAG_KEY = 'fintrack:legacy-migrated';

interface LegacyPayload {
  state?: {
    transactions?: Transaction[];
  };
}

/**
 * One-off import of transactions previously stored under the
 * `fintrack:transactions` localStorage key (before Dexie existed) into the
 * Dexie database under the provided userId. Runs at most once per device.
 */
export async function migrateLegacyLocalStorage(userId: string): Promise<void> {
  if (webStorage.getItem(FLAG_KEY)) return;
  const raw = webStorage.getItem(LEGACY_KEY);
  if (!raw) {
    webStorage.setItem(FLAG_KEY, '1');
    return;
  }
  try {
    const parsed = JSON.parse(raw) as LegacyPayload;
    const legacy = parsed.state?.transactions ?? [];
    if (legacy.length > 0) {
      await transactionRepository.insertMany(userId, legacy);
    }
  } catch {
    // ignore — corrupt legacy payload, just skip
  }
  webStorage.setItem(FLAG_KEY, '1');
  webStorage.removeItem(LEGACY_KEY);
}
