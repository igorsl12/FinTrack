export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'Salário'
  | 'Freelance'
  | 'Investimentos'
  | 'Outros (receita)';

export type ExpenseCategory =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Outros (despesa)';

/**
 * Category names are stored as plain strings to support user-defined
 * custom categories. The `IncomeCategory | ExpenseCategory` unions are
 * kept inside the `string` intersection trick so editors still autocomplete
 * the built-in names while accepting any string at runtime.
 */
export type Category =
  | IncomeCategory
  | ExpenseCategory
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  | (string & {});

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: string;
  type: TransactionType;
  createdAt: string;
  tags?: string[];
  /** If this transaction was generated from a recurring template. */
  recurringPlanId?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: Category;
  month?: string;
  search?: string;
  tag?: string;
  /** Inclusive lower bound (YYYY-MM-DD). */
  dateFrom?: string;
  /** Inclusive upper bound (YYYY-MM-DD). */
  dateTo?: string;
}

export interface MonthlyData {
  month: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Outros (receita)',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Educação',
  'Outros (despesa)',
];
