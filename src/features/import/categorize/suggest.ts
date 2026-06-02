import type { CategoryRuleRecord } from '@/shared/db/database';
import type {
  Category,
  TransactionType,
} from '@/features/transactions/types';
import { DEFAULT_RULES, type StaticRule } from './defaultRules';

export interface CategorySuggestion {
  category: Category;
  type: TransactionType;
  source: 'user-rule' | 'default-rule' | 'fallback';
  ruleId?: string;
  matchedPattern?: string;
}

/** Uppercase + strip diacritics + collapse whitespace. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

interface MatchCandidate {
  pattern: string;
  category: Category;
  type: TransactionType;
  source: CategorySuggestion['source'];
  ruleId?: string;
  /** Used to break ties: user rules > default rules; then longest pattern; then hitCount. */
  score: number;
}

/**
 * Suggests a category for a transaction description.
 *
 * Order of preference:
 *   1. User-defined rules (learned from past corrections) — highest priority.
 *   2. Built-in default rules covering common Brazilian merchants.
 *   3. Fallback: "Outros (despesa)" or "Outros (receita)" based on inferred type.
 *
 * When multiple rules match, the most specific one (longest pattern) wins;
 * ties are broken by user rules' hit count.
 */
export function suggestCategory(
  description: string,
  userRules: CategoryRuleRecord[],
  inferredType: TransactionType,
): CategorySuggestion {
  const text = normalize(description);
  const candidates: MatchCandidate[] = [];

  for (const rule of userRules) {
    if (text.includes(rule.pattern)) {
      candidates.push({
        pattern: rule.pattern,
        category: rule.category,
        type: rule.type,
        source: 'user-rule',
        ruleId: rule.id,
        score: 1_000_000 + rule.pattern.length * 1000 + rule.hitCount,
      });
    }
  }

  for (const rule of DEFAULT_RULES) {
    if (text.includes(rule.pattern)) {
      candidates.push({
        pattern: rule.pattern,
        category: rule.category,
        type: rule.type,
        source: 'default-rule',
        score: rule.pattern.length * 1000,
      });
    }
  }

  if (candidates.length === 0) {
    return {
      category:
        inferredType === 'income' ? 'Outros (receita)' : 'Outros (despesa)',
      type: inferredType,
      source: 'fallback',
    };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return {
    category: best.category,
    type: best.type,
    source: best.source,
    ruleId: best.ruleId,
    matchedPattern: best.pattern,
  };
}

/** Exposed so the engine can be unit-tested or reused outside React. */
export const __internal = { DEFAULT_RULES };
export type { StaticRule };
