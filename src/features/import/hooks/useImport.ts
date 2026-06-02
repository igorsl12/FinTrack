import { useCallback, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { parseCsvStatement, type ParsedRow } from '../parsers/csv';
import {
  suggestCategory,
  normalize,
  type CategorySuggestion,
} from '../categorize/suggest';
import { categoryRuleRepository } from '@/shared/db/categoryRuleRepository';
import { transactionRepository } from '@/shared/db/transactionRepository';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import type {
  Category,
  Transaction,
  TransactionType,
} from '@/features/transactions/types';

export interface PreviewItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  selected: boolean;
  suggestion: CategorySuggestion;
  edited: boolean;
}

interface PreviewState {
  profileName: string;
  items: PreviewItem[];
}

/**
 * Hook that drives the bank statement import flow.
 *
 * Steps: read file → parse CSV → suggest categories per row → let the user
 * edit / deselect → on confirm, persist transactions and "learn" any
 * categories the user changed.
 */
export function useImport() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  const loadFile = useCallback(async (file: File) => {
    setParsing(true);
    setError(null);
    try {
      const text = await file.text();
      const result = parseCsvStatement(text);
      if (!result.ok) {
        setError(result.error);
        setPreview(null);
        return;
      }
      const userId = useAuthStore.getState().currentUser?.id;
      const userRules = userId
        ? await categoryRuleRepository.listByUser(userId)
        : [];

      const items: PreviewItem[] = result.statement.rows.map((row) =>
        toPreviewItem(row, userRules),
      );
      setPreview({ profileName: result.statement.profileName, items });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao ler o arquivo.');
    } finally {
      setParsing(false);
    }
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<PreviewItem>) => {
      setPreview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.id === id
              ? {
                  ...it,
                  ...patch,
                  edited:
                    it.edited ||
                    (patch.category !== undefined &&
                      patch.category !== it.category) ||
                    (patch.type !== undefined && patch.type !== it.type),
                }
              : it,
          ),
        };
      });
    },
    [],
  );

  const setAllSelected = useCallback((selected: boolean) => {
    setPreview((prev) =>
      prev ? { ...prev, items: prev.items.map((it) => ({ ...it, selected })) } : prev,
    );
  }, []);

  const confirm = useCallback(async (): Promise<{
    imported: number;
    learned: number;
  } | null> => {
    if (!preview) return null;
    const userId = useAuthStore.getState().currentUser?.id;
    if (!userId) return null;

    setConfirming(true);
    try {
      const selected = preview.items.filter((it) => it.selected);
      const txs: Transaction[] = selected.map((it) => ({
        id: uuid(),
        description: it.description.slice(0, 80),
        amount: it.amount,
        category: it.category,
        type: it.type,
        date: it.date,
        createdAt: new Date().toISOString(),
      }));

      if (txs.length > 0) {
        await transactionRepository.insertMany(userId, txs);
      }

      let learned = 0;
      for (const it of selected) {
        if (!it.edited) continue;
        const pattern = derivePattern(it.description);
        if (!pattern) continue;
        await categoryRuleRepository.upsert(userId, {
          pattern,
          category: it.category,
          type: it.type,
        });
        learned++;
      }

      const txStore = useTransactionStore.getState();
      if (txStore.userId === userId) {
        await txStore.loadForUser(userId);
      }

      setPreview(null);
      return { imported: txs.length, learned };
    } finally {
      setConfirming(false);
    }
  }, [preview]);

  return {
    preview,
    parsing,
    confirming,
    error,
    loadFile,
    updateItem,
    setAllSelected,
    confirm,
    reset,
  };
}

function toPreviewItem(
  row: ParsedRow,
  userRules: Awaited<ReturnType<typeof categoryRuleRepository.listByUser>>,
): PreviewItem {
  const suggestion = suggestCategory(row.description, userRules, row.type);
  return {
    id: uuid(),
    date: row.date,
    description: row.description,
    amount: row.amount,
    type: suggestion.source === 'fallback' ? row.type : suggestion.type,
    category: suggestion.category,
    selected: true,
    suggestion,
    edited: false,
  };
}

/**
 * Builds a learning pattern from a transaction description.
 *
 * Picks the longest "merchant-looking" token so we don't store noise like
 * transaction IDs or dates. Returns null if nothing useful can be derived.
 */
function derivePattern(description: string): string | null {
  const normalized = normalize(description);
  const tokens = normalized
    .split(/[\s\-/]+/)
    .filter((t) => t.length >= 4 && !/^\d+$/.test(t));
  if (tokens.length === 0) return null;
  tokens.sort((a, b) => b.length - a.length);
  return tokens[0];
}
