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

export type Category = IncomeCategory | ExpenseCategory;

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
