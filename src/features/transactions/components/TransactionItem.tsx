import { ArrowDownLeft, ArrowUpRight, Pencil, Repeat, Trash2 } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionItem({
  transaction,
  onDelete,
  onEdit,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const hasTags = transaction.tags && transaction.tags.length > 0;
  const isRecurring = !!transaction.recurringPlanId;

  return (
    <div className="card p-3 flex items-start gap-3">
      <div
        className={[
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          isIncome
            ? 'bg-income-light text-income-dark'
            : 'bg-expense-light text-expense-dark',
        ].join(' ')}
      >
        {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
          {transaction.description}
          {isRecurring && (
            <Repeat
              size={11}
              className="text-balance shrink-0"
              aria-label="Recorrência"
            />
          )}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span>{formatDate(transaction.date)}</span>
          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {transaction.category}
          </span>
        </div>
        {hasTags && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {transaction.tags!.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-balance-light text-balance-dark"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <p
          className={[
            'text-sm font-semibold whitespace-nowrap',
            isIncome ? 'text-income-dark' : 'text-expense-dark',
          ].join(' ')}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            aria-label="Editar transação"
            className="text-slate-400 hover:text-balance transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            aria-label="Excluir transação"
            className="text-slate-400 hover:text-expense transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
